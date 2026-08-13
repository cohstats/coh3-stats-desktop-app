#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate machine_uid;

mod audio_manager;
mod battlegroup_info;
mod config;
mod dp_utils;
mod game_overlay;
mod map_stats;
mod overlay_server;
mod parse_log_file;
mod plugins;
mod process_watcher;
#[cfg(test)]
mod tests;

use dp_utils::load_from_store;
use log::{error, info};
use overlay_server::run_http_server;
use std::path::{Path, PathBuf};
use std::thread;
use tauri::Runtime;
use tauri::{AppHandle, Emitter, Manager};
// use tauri_plugin_log::Target; // Unused for now
// use tauri_plugin_dialog::{MessageDialogBuilder, MessageDialogKind}; // Unused for now
// use window_shadows::set_shadow; // Temporarily disabled due to compatibility issues with Tauri v2
use std::process;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Chromium skips producing frames for a window it believes is occluded. A
    // transparent, always-on-top overlay sitting over a borderless-fullscreen game is
    // exactly the case its heuristic gets wrong: the game window counts as covering us,
    // so the overlay shows up blank until some input forces the occlusion state to be
    // recalculated. Must be set before any WebView2 environment is created, and it is
    // process-wide - a per-window `additional_browser_args` would conflict with the
    // main window's environment.
    #[cfg(target_os = "windows")]
    std::env::set_var(
        "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
        "--disable-features=CalculateNativeWinOcclusion",
    );

    // Add monitoring using sentry
    let _guard = sentry::init(("https://5a9a5418c06b995fe1c6221c83451612@o4504995920543744.ingest.sentry.io/4506676182646784", sentry::ClientOptions {
      release: sentry::release_name!(),
      ..Default::default()
    }));

    let builder = tauri::Builder::default()
        .manage(audio_manager::AudioManagerState::default())
        .manage(process_watcher::ProcessWatcherState::default())
        .manage(map_stats::MapStatsState::default())
        .manage(battlegroup_info::BattlegroupInfoState::default())
        .manage(game_overlay::GameOverlayState::default())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .level_for("rustls", log::LevelFilter::Warn)
                .level_for("reqwest", log::LevelFilter::Warn)
                .level_for("hyper", log::LevelFilter::Warn)
                .level_for("tungstenite", log::LevelFilter::Warn)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            default_log_file_path,
            default_playback_path,
            check_path_exists,
            get_machine_id,
            parse_log_file::parse_log_file_reverse,
            enable_audio_muting,
            disable_audio_muting,
            update_audio_mute_settings,
            start_process_watcher,
            stop_process_watcher,
            map_stats::get_map_stats,
            battlegroup_info::get_battlegroup_info,
            game_overlay::game_overlay_show,
            game_overlay::game_overlay_hide,
            game_overlay::game_overlay_is_supported
        ])
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            let window = match app.get_webview_window("main") {
                Some(w) => w,
                None => {
                    error!("Failed to get main window: Window not found");
                    process::exit(1);
                }
            };

            if let Err(e) = window.set_focus() {
                error!("Failed to set window focus: {}", e);
                sentry::capture_message(
                    &format!("Window focus error: {}", e),
                    sentry::Level::Error,
                );
            }

            if let Err(e) =
                window.request_user_attention(Some(tauri::UserAttentionType::Informational))
            {
                error!("Failed to request user attention: {}", e);
                sentry::capture_message(
                    &format!("User attention error: {}", e),
                    sentry::Level::Error,
                );
            }

            if let Err(e) = app.emit("single-instance", Payload { args: argv, cwd }) {
                error!("Failed to emit single-instance event: {}", e);
                sentry::capture_message(
                    &format!("Single instance event error: {}", e),
                    sentry::Level::Error,
                );
            }
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init());

    #[cfg(not(target_os = "macos"))]
    let builder = builder.plugin(
        tauri_plugin_window_state::Builder::default()
            // the overlay positions itself - never let the plugin restore its geometry
            .with_denylist(&[game_overlay::OVERLAY_WINDOW_LABEL])
            .build(),
    );

    builder
        .setup(setup)
        .build(tauri::generate_context!())
        .unwrap_or_else(|e| {
            error!("Failed to build Tauri application: {}", e);
            sentry::capture_message(
                &format!("Tauri application error: {}", e),
                sentry::Level::Error,
            );
            error!("Failed to start app: {}", e);
            process::exit(1);
        })
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                // Ensure game audio is unmuted when app exits
                info!("App exiting, ensuring game audio is unmuted");
                audio_manager::cleanup_on_exit(app_handle);
                // Never leave the overlay on screen after the app is gone
                game_overlay::hide(app_handle);
            }
        });
}

fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    // Initialize updater plugin for desktop platforms
    #[cfg(desktop)]
    {
        info!("Initializing updater plugin");
        if let Err(e) = handle.plugin(tauri_plugin_updater::Builder::new().build()) {
            error!("Failed to initialize updater plugin: {}", e);
            sentry::capture_message(
                &format!("Updater plugin initialization error: {}", e),
                sentry::Level::Error,
            );
            // Don't fail the entire setup if updater fails
            info!("Continuing without updater plugin");
        }
    }

    if load_from_store(handle.clone(), "streamerOverlayEnabled").unwrap_or(false) {
        info!("Streamer overlay server is enabled");
        match handle.path().app_data_dir() {
            Ok(mut file_path) => {
                file_path.push("streamerOverlay.html");
                info!("Expecting the streamerOverlay at {:?}", file_path);

                let _handle = thread::spawn(|| {
                    run_http_server(file_path);
                });
            }
            Err(e) => {
                error!("Failed to get app data directory for overlay: {}", e);
                sentry::capture_message(
                    &format!("App data directory access error (overlay): {}", e),
                    sentry::Level::Error,
                );
                // Don't fail setup, just skip overlay server
                info!("Continuing without streamer overlay server");
            }
        }
    } else {
        info!("Streamer overlay server is disabled");
    }

    // Start process watcher for game start/stop detection
    #[cfg(target_os = "windows")]
    {
        info!("Starting process watcher");
        if let Err(e) = process_watcher::start_watching(handle.clone()) {
            error!("Failed to start process watcher: {}", e);
            sentry::capture_message(
                &format!("Process watcher initialization error: {}", e),
                sentry::Level::Error,
            );
            // Don't fail the entire setup if process watcher fails
            info!("Continuing without process watcher");
        }
    }

    // Add window shadows - temporarily disabled due to compatibility issues with Tauri v2
    // let window = match app.get_webview_window("main") {
    //     Some(w) => w,
    //     None => {
    //         error!("Failed to get main window: Window not found");
    //         return Err("Main window not found".into());
    //     }
    // };

    // if let Err(e) = set_shadow(&window, true) {
    //     error!("Failed to set window shadow: {}", e);
    //     sentry::capture_message(&format!("Window shadow error: {}", e), sentry::Level::Error);
    // }

    // In-game matchup overlay: create the window once, hidden. It is only ever
    // shown/hidden afterwards - see game_overlay/mod.rs.
    game_overlay::create_overlay_window(handle);

    // Initialize map stats fetching (non-blocking)
    map_stats::init_map_stats(handle.clone());

    // Initialize battlegroup info fetching (non-blocking)
    battlegroup_info::init_battlegroup_info(handle.clone());

    Ok(())
}

/// returns the default expected log file path
#[tauri::command]
fn default_log_file_path() -> Result<String, String> {
    get_game_path_with_sub_path("warnings.log")
}

#[tauri::command]
fn default_playback_path() -> Result<String, String> {
    get_game_path_with_sub_path("playback")
}

fn get_game_path_with_sub_path(sub_path: &str) -> Result<String, String> {
    let mut path = match get_game_path() {
        Ok(p) => p,
        Err(err) => {
            error!("Game directory not found {}", err);
            sentry::capture_message(
                format!("Game directory not found ({} path)", sub_path).as_str(),
                sentry::Level::Error,
            );
            return Err(
                "Game directory not found. Please check your system permissions.".to_string(),
            );
        }
    };
    path.push(sub_path);

    if path.exists() {
        return Ok(path.display().to_string());
    }
    Err(format!("Route to ({}) not found.", path.display()).to_string())
}

fn get_game_path() -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    {
        let mut path = match dirs::document_dir() {
            Some(p) => p,
            None => {
                error!("Failed to get document directory: Directory not found");
                sentry::capture_message(
                    "Document directory not found (log file path)",
                    sentry::Level::Error,
                );
                return Err(
                    "Document directory not found. Please check your system permissions."
                        .to_string(),
                );
            }
        };
        path.push("My Games/Company of Heroes 3"); // TODO: Is this "my games" also on non-English Windows?
        return Ok(path);
    }

    #[cfg(target_os = "linux")]
    {
        let mut path = match dirs::data_local_dir() {
            Some(p) => p,
            None => {
                error!("Failed to get local data directory: Directory not found");
                sentry::capture_message(
                    "Local data directory not found (log file path)",
                    sentry::Level::Error,
                );
                return Err(
                    "Local data directory not found. Please check your system permissions."
                        .to_string(),
                );
            }
        };
        // Games folder in Linux
        path.push("Steam/steamapps/compatdata");

        if !path.exists() {
            return Err(
                "Steam compatdata directory not found. Please check your system permissions."
                    .to_string(),
            );
        }

        // There could be several sessions, for each game installed
        // this is why we needed to check which one is the correct
        for session in path.read_dir().expect("read_dir call failed") {
            if let Ok(directory) = session {
                let mut tmp_path = directory.path();
                // TODO: Is this "My Games" also on non-English Windows? (I keep this question in linux)
                tmp_path.push("pfx/drive_c/users/steamuser/Documents/My Games/Company of Heroes 3");
                if tmp_path.exists() {
                    return Ok(tmp_path);
                }
            }
        }

        Err("Unable to find the game path in Linux.".to_string())
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        Err("OS not supported.".to_string())
    }
}

/// checks if log file can be found on system
#[tauri::command]
fn check_path_exists(path: &str) -> bool {
    Path::new(path).exists()
}

/// get the system machine id
#[tauri::command]
fn get_machine_id() -> Result<String, String> {
    match machine_uid::get() {
        Ok(id) => Ok(id),
        Err(e) => {
            error!("Failed to get machine ID: {}", e);
            sentry::capture_message(&format!("Machine ID error: {}", e), sentry::Level::Error);
            Err(format!("Failed to get machine ID: {}", e))
        }
    }
}

// Audio muting commands
#[tauri::command]
async fn enable_audio_muting<R: Runtime>(handle: AppHandle<R>) -> Result<(), String> {
    audio_manager::enable_audio_muting(handle)
}

#[tauri::command]
async fn disable_audio_muting<R: Runtime>(handle: AppHandle<R>) -> Result<(), String> {
    audio_manager::disable_audio_muting(handle)
}

#[tauri::command]
async fn update_audio_mute_settings<R: Runtime>(
    handle: AppHandle<R>,
    mute_only_out_of_game: bool,
    is_in_game: bool,
) -> Result<(), String> {
    audio_manager::update_mute_settings(handle, mute_only_out_of_game, is_in_game)
}

// Process watcher commands
#[tauri::command]
async fn start_process_watcher<R: Runtime>(handle: AppHandle<R>) -> Result<(), String> {
    process_watcher::start_watching(handle)
}

#[tauri::command]
async fn stop_process_watcher<R: Runtime>(handle: AppHandle<R>) -> Result<(), String> {
    process_watcher::stop_watching(handle)
}
