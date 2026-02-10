//! Unified process watcher and audio monitor implementation
//!
//! This module provides a single monitoring loop that:
//! 1. Polls every 1 second to check if the game process exists
//! 2. Checks if the game is the foreground window
//! 3. Mutes/unmutes the game audio based on foreground state
//!
//! This consolidates the previous WMI event-based approach and Windows Event Hook
//! approach into a simpler polling-based solution.

use log::{error, info};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager, Runtime};
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};

use super::find_game_process_id;
use crate::audio_manager::{windows_audio, AudioManagerState};
use crate::config::GAME_PROCESS_NAME;

/// Get the process ID of a window
fn get_window_process_id(hwnd: HWND) -> u32 {
    let mut pid: u32 = 0;
    unsafe {
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
    }
    pid
}

/// Check if the game is currently the foreground window
fn is_game_foreground(game_pid: u32) -> bool {
    let foreground_hwnd = unsafe { GetForegroundWindow() };
    let foreground_pid = get_window_process_id(foreground_hwnd);
    foreground_pid == game_pid
}

/// Unified monitoring loop that handles both process detection and foreground monitoring
///
/// This function polls every 1 second to:
/// 1. Check if the game process exists
/// 2. If it exists, check if it's the foreground window
/// 3. Mute/unmute based on foreground state and settings
pub fn run_unified_monitor<R: Runtime>(
    handle: AppHandle<R>,
    watching_flag: Arc<Mutex<bool>>,
) -> Result<(), String> {
    info!("Starting unified process and audio monitor");

    // Track the current game state
    let mut current_game_pid: Option<u32> = None;
    let mut currently_muted = false;

    // Track when the game went to background (for 1-second delay before muting)
    let mut background_since: Option<Instant> = None;

    // Track pending unmute on game start (audio session may not exist immediately)
    let mut pending_unmute_on_start = false;

    loop {
        // Check if we should stop watching
        if let Ok(watching) = watching_flag.lock() {
            if !*watching {
                info!("Unified monitor stopping (flag set to false)");
                break;
            }
        }

        // Sleep for 1 second between checks
        std::thread::sleep(Duration::from_secs(1));

        // Find the game process
        let game_pid = find_game_process_id();

        match (current_game_pid, game_pid) {
            // Game just started
            (None, Some(pid)) => {
                info!("Game process detected: {} (PID: {})", GAME_PROCESS_NAME, pid);
                current_game_pid = Some(pid);
                currently_muted = false;
                background_since = None;

                // Try to ensure game starts unmuted, but audio session may not exist yet
                if windows_audio::set_game_mute(pid, false).is_err() {
                    // Audio session not ready yet, will retry on next poll iterations
                    info!("Audio session not ready on game start, will retry unmuting");
                    pending_unmute_on_start = true;
                } else {
                    pending_unmute_on_start = false;
                }
            }

            // Game just stopped
            (Some(old_pid), None) => {
                info!("Game process stopped (PID: {})", old_pid);
                current_game_pid = None;
                currently_muted = false;
                background_since = None;
                pending_unmute_on_start = false;
            }

            // Game is running - check foreground state
            (Some(_), Some(pid)) => {
                // Update PID in case it changed (shouldn't happen, but be safe)
                current_game_pid = Some(pid);

                // Retry pending unmute if audio session wasn't ready on game start
                if pending_unmute_on_start {
                    if windows_audio::set_game_mute(pid, false).is_ok() {
                        info!("Game unmuted on start (delayed - audio session now ready)");
                        pending_unmute_on_start = false;
                    }
                    // If still failing, will retry on next poll iteration
                }

                // Check if we should skip muting based on settings
                let should_skip_muting = {
                    if let Some(state) = handle.try_state::<AudioManagerState>() {
                        let mute_only_out_of_game = state.mute_only_out_of_game.lock().map(|v| *v).unwrap_or(false);
                        let is_in_game = state.is_in_game.lock().map(|v| *v).unwrap_or(false);
                        mute_only_out_of_game && is_in_game
                    } else {
                        false
                    }
                };

                // Check if audio muting is enabled
                let muting_enabled = {
                    if let Some(state) = handle.try_state::<AudioManagerState>() {
                        state.enabled.lock().map(|v| *v).unwrap_or(false)
                    } else {
                        false
                    }
                };

                if !muting_enabled {
                    // Audio muting not enabled, skip mute/unmute logic
                    continue;
                }

                let is_foreground = is_game_foreground(pid);

                if is_foreground {
                    // Game is in foreground - unmute if muted
                    background_since = None;
                    if currently_muted {
                        if let Err(e) = windows_audio::set_game_mute(pid, false) {
                            error!("Failed to unmute game: {}", e);
                        } else {
                            info!("Game unmuted (foreground)");
                            currently_muted = false;
                        }
                    }
                } else {
                    // Game is in background
                    if should_skip_muting {
                        // Skip muting if muteOnlyOutOfGame is enabled and we're in-game
                        background_since = None;
                        continue;
                    }

                    if !currently_muted {
                        // Start tracking when game went to background
                        if background_since.is_none() {
                            background_since = Some(Instant::now());
                        }

                        // Check if 1 second has passed since going to background
                        if let Some(since) = background_since {
                            if since.elapsed() >= Duration::from_secs(1) {
                                // Re-check foreground state to avoid muting during quick alt-tabs
                                if !is_game_foreground(pid) {
                                    if let Err(e) = windows_audio::set_game_mute(pid, true) {
                                        error!("Failed to mute game: {}", e);
                                    } else {
                                        info!("Game muted (background)");
                                        currently_muted = true;
                                    }
                                } else {
                                    // Game came back to foreground, reset timer
                                    background_since = None;
                                }
                            }
                        }
                    }
                }
            }

            // No game running
            (None, None) => {
                // Nothing to do
            }
        }
    }

    // Ensure game is unmuted when stopping
    if let Some(pid) = current_game_pid {
        if currently_muted {
            let _ = windows_audio::set_game_mute(pid, false);
            info!("Game unmuted on monitor stop");
        }
    }

    info!("Unified monitor stopped");
    Ok(())
}

