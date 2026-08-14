//! In-Game Matchup Overlay
//!
//! Shows the matchup on top of the CoH3 window while the game is on its loading
//! screen. This module owns only the *window mechanics*: a single transparent,
//! always-on-top, click-through webview window that is created hidden at startup and
//! afterwards only shown, hidden and repositioned.
//!
//! The content is pushed in from the frontend (`game-overlay:data` event); nothing in
//! here knows about players or matches.
//!
//! Not to be confused with `overlay_server.rs`, which serves the OBS *streamer*
//! overlay over HTTP - a different feature.
//!
//! Windows-only. Every public function has a no-op stub on other platforms.

pub mod geometry;
mod window_detector;

use geometry::Bounds;
use log::{error, info};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Manager, Runtime};

/// Label of the overlay window. `src/main.tsx` branches on it, and
/// `game-overlay-capabilities.json` scopes permissions to it.
pub const OVERLAY_WINDOW_LABEL: &str = "game-overlay";

/// The game window does not move during a loading screen, so a slow tick is plenty.
const WATCHER_TICK_MS: u64 = 500;

#[derive(Default)]
pub struct GameOverlayState {
    /// The feature wants the overlay up (i.e. we are on a loading screen).
    wanted: AtomicBool,
    /// The overlay window is currently on screen.
    shown: AtomicBool,
    /// Signal for the watcher thread. Cleared to make it exit on its own next tick -
    /// it is never `join()`ed, which is what deadlocked the earlier attempt.
    watcher_running: Arc<AtomicBool>,
    /// Bumped on every stand-down. A watcher carries the token it started with and
    /// exits without touching shared state once the token no longer matches, so a
    /// hide-then-show cannot leave the outgoing watcher stopping the incoming one.
    watcher_generation: Arc<AtomicU64>,
}

#[cfg(target_os = "windows")]
pub fn create_overlay_window<R: Runtime>(app: &AppHandle<R>) {
    use tauri::{WebviewUrl, WebviewWindowBuilder};

    if app.get_webview_window(OVERLAY_WINDOW_LABEL).is_some() {
        return;
    }

    // Created once, hidden, at startup. Creating it per match would take the
    // foreground while WebView2 initialises and could minimise the game.
    let window = match WebviewWindowBuilder::new(
        app,
        OVERLAY_WINDOW_LABEL,
        WebviewUrl::App("index.html".into()),
    )
    .title("Grenadier In-Game Overlay")
    .inner_size(1536.0, 420.0)
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .focused(false)
    .visible(false)
    .shadow(false)
    .build()
    {
        Ok(w) => w,
        Err(e) => {
            error!("Game overlay: failed to create window: {}", e);
            sentry::capture_message(
                &format!("Game overlay window creation error: {}", e),
                sentry::Level::Error,
            );
            return;
        }
    };

    match window.hwnd() {
        Ok(hwnd) => window_detector::apply_overlay_styles(hwnd.0 as isize),
        Err(e) => error!("Game overlay: could not get HWND: {}", e),
    }

    if let Err(e) = window.set_ignore_cursor_events(true) {
        error!("Game overlay: set_ignore_cursor_events failed: {}", e);
    }

    info!("Game overlay: window created (hidden)");
}

#[cfg(not(target_os = "windows"))]
pub fn create_overlay_window<R: Runtime>(_app: &AppHandle<R>) {
    log::info!("Game overlay is only supported on Windows");
}

/// Outcome of one watcher tick.
#[derive(PartialEq)]
enum Tick {
    Continue,
    /// Nothing left to track - the watcher thread exits.
    Stop,
}

/// Carried across watcher ticks.
#[derive(Default)]
struct TickState {
    last_rect: Option<Bounds>,
    /// Consecutive ticks where another process held the foreground.
    away_ticks: u8,
    /// Last logged visibility decision, so the log records changes and not every tick.
    last_decision: Option<bool>,
}

/// How many consecutive ticks the game may be out of the foreground before the overlay
/// is pulled. One tick of tolerance rides out the brief handovers a loading screen does.
const AWAY_TICKS_BEFORE_HIDE: u8 = 2;

fn show_window<R: Runtime>(window: &tauri::WebviewWindow<R>, state: &GameOverlayState) {
    if state.shown.load(Ordering::SeqCst) {
        return;
    }
    if let Err(e) = window.show() {
        error!("Game overlay: show failed: {}", e);
        return;
    }
    // `hwnd()` only exists on Windows; everything it feeds is a no-op elsewhere.
    #[cfg(target_os = "windows")]
    if let Ok(hwnd) = window.hwnd() {
        // Re-apply after show(): the styles are what keep it click-through and
        // non-activating, and they must never be lost.
        window_detector::apply_overlay_styles(hwnd.0 as isize);
        // Deliberately not `set_always_on_top` - see raise_without_activating.
        window_detector::raise_without_activating(hwnd.0 as isize);
    }
    state.shown.store(true, Ordering::SeqCst);
}

fn hide_window<R: Runtime>(window: &tauri::WebviewWindow<R>, state: &GameOverlayState) {
    if !state.shown.load(Ordering::SeqCst) {
        return;
    }
    if let Err(e) = window.hide() {
        error!("Game overlay: hide failed: {}", e);
    }
    state.shown.store(false, Ordering::SeqCst);
}

/// Position the overlay over the game window and decide whether it should be on
/// screen right now. Called once by `show`, then on every watcher tick.
fn apply<R: Runtime>(handle: &AppHandle<R>, tick: &mut TickState) -> Tick {
    let Some(window) = handle.get_webview_window(OVERLAY_WINDOW_LABEL) else {
        return Tick::Stop;
    };
    let state = handle.state::<GameOverlayState>();

    if !state.wanted.load(Ordering::SeqCst) {
        hide_window(&window, &state);
        return Tick::Stop;
    }

    #[cfg(target_os = "windows")]
    let pid = crate::process_watcher::find_game_process_id();
    #[cfg(not(target_os = "windows"))]
    let pid: Option<u32> = None;

    // Game gone - drop the overlay and stop wanting it.
    let Some(pid) = pid else {
        hide_window(&window, &state);
        state.wanted.store(false, Ordering::SeqCst);
        return Tick::Stop;
    };

    // Process alive but no usable window yet (still starting, or between modes):
    // keep the overlay off screen and try again next tick.
    let Some(hwnd) = window_detector::find_window_for_pid(pid) else {
        hide_window(&window, &state);
        return Tick::Continue;
    };
    let Some(bounds) = window_detector::get_window_bounds(hwnd) else {
        hide_window(&window, &state);
        return Tick::Continue;
    };

    let rect = geometry::overlay_rect(bounds, window_detector::get_dpi(hwnd));
    if tick.last_rect != Some(rect) {
        let sized = window.set_size(tauri::PhysicalSize::new(
            rect.width as u32,
            rect.height as u32,
        ));
        if let Err(e) = &sized {
            error!("Game overlay: set_size failed: {}", e);
        }
        let positioned = window.set_position(tauri::PhysicalPosition::new(rect.x, rect.y));
        if let Err(e) = &positioned {
            error!("Game overlay: set_position failed: {}", e);
        }
        // Only remember the rect once it actually took, so a failed call is retried
        // on the next tick instead of being cached as done.
        if sized.is_ok() && positioned.is_ok() {
            tick.last_rect = Some(rect);
        }
    }

    // Only draw while the game owns the foreground - otherwise the overlay would float
    // over the desktop or over other apps.
    //
    // Compared by process, not by HWND: the game has more than one top-level window and
    // the one that holds activation is not always the big render window we track. An
    // unknown foreground (null during an activation handover) is not treated as "away".
    //
    // Our own process counts as the game having focus: the overlay window lives in it,
    // and if activation lands on it - or the user tabs over to check the app - that is
    // not a reason to tear the overlay down.
    let foreground = window_detector::foreground_pid();
    let own_pid = std::process::id();
    let away = matches!(foreground, Some(fg) if fg != pid && fg != own_pid);
    tick.away_ticks = if away {
        tick.away_ticks.saturating_add(1)
    } else {
        0
    };

    let visible = tick.away_ticks < AWAY_TICKS_BEFORE_HIDE && !window_detector::is_minimised(hwnd);
    if tick.last_decision != Some(visible) {
        info!(
            "Game overlay: {} (game pid {}, own pid {}, foreground pid {:?})",
            if visible { "showing" } else { "hiding" },
            pid,
            own_pid,
            foreground
        );
        tick.last_decision = Some(visible);
    }

    if visible {
        show_window(&window, &state);
    } else {
        hide_window(&window, &state);
    }

    Tick::Continue
}

fn start_watcher<R: Runtime>(handle: &AppHandle<R>, initial: TickState) {
    let (running, generation, token) = {
        let state = handle.state::<GameOverlayState>();
        // Already running - it will keep tracking, nothing to do.
        if state
            .watcher_running
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_err()
        {
            return;
        }
        (
            Arc::clone(&state.watcher_running),
            Arc::clone(&state.watcher_generation),
            state.watcher_generation.load(Ordering::SeqCst),
        )
    };

    let handle = handle.clone();
    std::thread::spawn(move || {
        info!("Game overlay: watcher {} started", token);
        let mut tick = initial;

        loop {
            std::thread::sleep(std::time::Duration::from_millis(WATCHER_TICK_MS));
            // Checked before `running`: a superseded watcher would otherwise see the
            // flag the *new* watcher just set and keep ticking alongside it.
            if generation.load(Ordering::SeqCst) != token {
                info!("Game overlay: watcher {} superseded", token);
                return;
            }
            if !running.load(Ordering::SeqCst) {
                break;
            }
            if apply(&handle, &mut tick) == Tick::Stop {
                break;
            }
        }

        // Never clear the flag on behalf of a watcher that has replaced us.
        if generation.load(Ordering::SeqCst) == token {
            running.store(false, Ordering::SeqCst);
        }
        info!("Game overlay: watcher {} stopped", token);
    });
}

/// Show the overlay over the game window and keep it there.
///
/// Returns `false` when the game window could not be located yet - the watcher stays
/// armed and the overlay appears as soon as it can be found.
#[tauri::command]
pub async fn game_overlay_show<R: Runtime>(handle: AppHandle<R>) -> Result<bool, String> {
    if handle.get_webview_window(OVERLAY_WINDOW_LABEL).is_none() {
        return Err("Game overlay window does not exist".to_string());
    }

    handle
        .state::<GameOverlayState>()
        .wanted
        .store(true, Ordering::SeqCst);

    // Place and show immediately so there is no visible delay, then let the watcher
    // take over.
    let mut tick = TickState::default();
    let placed = apply(&handle, &mut tick) == Tick::Continue && tick.last_rect.is_some();
    start_watcher(&handle, tick);

    Ok(placed)
}

/// Hide the overlay and stand the watcher down.
#[tauri::command]
pub async fn game_overlay_hide<R: Runtime>(handle: AppHandle<R>) -> Result<(), String> {
    hide(&handle);
    Ok(())
}

pub fn hide<R: Runtime>(handle: &AppHandle<R>) {
    let state = handle.state::<GameOverlayState>();
    state.wanted.store(false, Ordering::SeqCst);
    // Signal only. Never join here: the watcher locks nothing, it just exits next tick.
    // Bumping the generation first retires the running watcher even if a `show` races
    // in and starts a new one before it woke up.
    state.watcher_generation.fetch_add(1, Ordering::SeqCst);
    state.watcher_running.store(false, Ordering::SeqCst);

    if let Some(window) = handle.get_webview_window(OVERLAY_WINDOW_LABEL) {
        hide_window(&window, &state);
    }
}

/// Whether the overlay can be shown right now: Windows, overlay window created, and
/// the game window findable.
#[tauri::command]
pub async fn game_overlay_is_supported<R: Runtime>(handle: AppHandle<R>) -> Result<bool, String> {
    if !cfg!(target_os = "windows") {
        return Ok(false);
    }
    if handle.get_webview_window(OVERLAY_WINDOW_LABEL).is_none() {
        return Ok(false);
    }
    Ok(window_detector::find_game_window().is_some())
}
