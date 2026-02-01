//! Audio Manager Module
//!
//! This module provides state management for automatic audio muting of Company of Heroes 3
//! when the game is not in the foreground. The actual muting logic is handled by the
//! unified process watcher in the process_watcher module.
//!
//! This module provides:
//! - State for whether audio muting is enabled
//! - Settings for mute behavior (e.g., mute only when in menu)

#[cfg(target_os = "windows")]
pub mod windows_audio;

use log::info;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "windows")]
use crate::process_watcher::find_game_process_id;

/// State for the audio manager, managed by Tauri
///
/// This state is accessed by the unified process watcher to determine
/// whether to mute/unmute the game based on foreground state.
pub struct AudioManagerState {
    /// Flag indicating if audio muting is enabled
    /// When true, the unified watcher will mute/unmute based on foreground state
    pub enabled: Arc<Mutex<bool>>,
    /// Flag indicating if muting should only happen when out of game (in menu)
    #[cfg(target_os = "windows")]
    pub mute_only_out_of_game: Arc<Mutex<bool>>,
    /// Current game state (true = in game or loading, false = menu/closed)
    #[cfg(target_os = "windows")]
    pub is_in_game: Arc<Mutex<bool>>,
}

impl Default for AudioManagerState {
    fn default() -> Self {
        Self {
            enabled: Arc::new(Mutex::new(false)),
            #[cfg(target_os = "windows")]
            mute_only_out_of_game: Arc::new(Mutex::new(false)),
            #[cfg(target_os = "windows")]
            is_in_game: Arc::new(Mutex::new(false)),
        }
    }
}

/// Enable automatic audio muting when game is not in foreground.
/// This just sets a flag - the actual muting is done by the process watcher.
#[cfg(target_os = "windows")]
pub fn enable_audio_muting<R: Runtime>(handle: AppHandle<R>) -> Result<(), String> {
    let state = handle.state::<AudioManagerState>();
    let mut enabled = state.enabled.lock().map_err(|e| e.to_string())?;
    if !*enabled {
        *enabled = true;
        info!("Audio muting enabled");
    }
    Ok(())
}

/// Disable automatic audio muting and ensure the game is unmuted.
#[cfg(target_os = "windows")]
pub fn disable_audio_muting<R: Runtime>(handle: AppHandle<R>) -> Result<(), String> {
    let state = handle.state::<AudioManagerState>();
    let mut enabled = state.enabled.lock().map_err(|e| e.to_string())?;
    if *enabled {
        *enabled = false;
        info!("Audio muting disabled");
        // Ensure game is unmuted when disabling
        if let Some(game_pid) = find_game_process_id() {
            let _ = windows_audio::set_game_mute(game_pid, false);
        }
    }
    Ok(())
}

/// Cleanup function for app exit - ensures game audio is unmuted
#[cfg(target_os = "windows")]
pub fn cleanup_on_exit<R: Runtime>(handle: &AppHandle<R>) {
    if let Some(game_pid) = find_game_process_id() {
        info!("Found game process {}, unmuting before exit", game_pid);
        if let Err(e) = windows_audio::set_game_mute(game_pid, false) {
            log::error!("Failed to unmute game on exit: {}", e);
        }
    }
    let _ = disable_audio_muting(handle.clone());
}

/// Update the mute settings (muteOnlyOutOfGame and game state)
///
/// The process watcher checks these settings before muting/unmuting.
#[cfg(target_os = "windows")]
pub fn update_mute_settings<R: Runtime>(
    handle: AppHandle<R>,
    mute_only_out_of_game: bool,
    is_in_game: bool,
) -> Result<(), String> {
    let state = handle.state::<AudioManagerState>();

    {
        let mut setting = state.mute_only_out_of_game.lock().map_err(|e| e.to_string())?;
        *setting = mute_only_out_of_game;
    }
    {
        let mut in_game = state.is_in_game.lock().map_err(|e| e.to_string())?;
        *in_game = is_in_game;
    }

    info!(
        "Audio mute settings updated: mute_only_out_of_game={}, is_in_game={}",
        mute_only_out_of_game, is_in_game
    );

    // If we're now in a state where muting should be disabled, unmute the game
    if mute_only_out_of_game && is_in_game {
        if let Some(game_pid) = find_game_process_id() {
            info!("Unmuting game because we're in-game with muteOnlyOutOfGame enabled");
            let _ = windows_audio::set_game_mute(game_pid, false);
        }
    }

    Ok(())
}

// Non-Windows stubs
#[cfg(not(target_os = "windows"))]
pub fn enable_audio_muting<R: Runtime>(_handle: AppHandle<R>) -> Result<(), String> {
    log::warn!("Audio muting is only supported on Windows");
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn disable_audio_muting<R: Runtime>(_handle: AppHandle<R>) -> Result<(), String> {
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn cleanup_on_exit<R: Runtime>(_handle: &AppHandle<R>) {}

#[cfg(not(target_os = "windows"))]
pub fn update_mute_settings<R: Runtime>(
    _handle: AppHandle<R>,
    _mute_only_out_of_game: bool,
    _is_in_game: bool,
) -> Result<(), String> {
    Ok(())
}

