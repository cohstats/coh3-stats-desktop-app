//! Process Watcher Module
//!
//! This module provides unified monitoring for the game process, handling both
//! process detection and audio muting based on foreground state.
//!
//! It uses a single polling-based approach that checks every 1 second for:
//! - Game process existence
//! - Foreground window state
//! - Audio mute/unmute based on settings

use log::{debug, error, info};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "windows")]
mod unified_monitor;

#[cfg(target_os = "windows")]
use windows::core::Owned;
#[cfg(target_os = "windows")]
use windows::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
    TH32CS_SNAPPROCESS,
};

use crate::config::GAME_PROCESS_NAME;

/// State for the process watcher, managed by Tauri
pub struct ProcessWatcherState {
    /// Flag indicating if watching is active
    watching: Arc<Mutex<bool>>,
    /// Handle to the unified watcher thread
    watcher_thread: Mutex<Option<JoinHandle<()>>>,
}

impl Default for ProcessWatcherState {
    fn default() -> Self {
        Self {
            watching: Arc::new(Mutex::new(false)),
            watcher_thread: Mutex::new(None),
        }
    }
}

/// Whether a NUL-terminated UTF-16 exe name (as in `PROCESSENTRY32W::szExeFile`) is the game.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn is_game_exe_name(exe_file: &[u16]) -> bool {
    let len = exe_file.iter().position(|&c| c == 0).unwrap_or(exe_file.len());
    String::from_utf16_lossy(&exe_file[..len]).to_lowercase() == GAME_PROCESS_NAME
}

/// Find the game process ID by searching for the game process.
///
/// Uses a Toolhelp process snapshot, which carries every process's exe name, so no
/// process has to be opened: nothing to leak, no 1024-process cap, and it works when
/// the game runs elevated or is otherwise protected.
#[cfg(target_os = "windows")]
pub fn find_game_process_id() -> Option<u32> {
    unsafe {
        // `Owned` closes the snapshot handle on drop, on every return path.
        let snapshot = match CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) {
            Ok(handle) => Owned::new(handle),
            Err(e) => {
                error!("Failed to snapshot processes: {}", e);
                return None;
            }
        };

        let mut entry = PROCESSENTRY32W {
            dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
            ..Default::default()
        };

        let mut more = Process32FirstW(*snapshot, &mut entry).is_ok();
        while more {
            if is_game_exe_name(&entry.szExeFile) {
                debug!("Found game process (PID: {})", entry.th32ProcessID);
                return Some(entry.th32ProcessID);
            }
            more = Process32NextW(*snapshot, &mut entry).is_ok();
        }

        None
    }
}

/// Start watching for game process events and audio monitoring
#[cfg(target_os = "windows")]
pub fn start_watching<R: Runtime>(handle: AppHandle<R>) -> Result<(), String> {
    let state = handle.state::<ProcessWatcherState>();

    // Check if already watching
    {
        let watching = state.watching.lock().map_err(|e| e.to_string())?;
        if *watching {
            info!("Process watcher already active");
            return Ok(());
        }
    }

    // Set watching flag
    {
        let mut watching = state.watching.lock().map_err(|e| e.to_string())?;
        *watching = true;
    }

    let watching_flag = Arc::clone(&state.watching);
    let handle_clone = handle.clone();

    // Spawn single unified monitoring thread
    let watcher_thread = thread::spawn(move || {
        info!("Unified process watcher thread started");
        if let Err(e) = unified_monitor::run_unified_monitor(handle_clone, watching_flag) {
            error!("Unified process watcher error: {}", e);
            sentry::capture_message(
                &format!("Unified process watcher error: {}", e),
                sentry::Level::Error,
            );
        }
        info!("Unified process watcher thread exiting");
    });

    // Store thread handle
    {
        let mut thread_handle = state.watcher_thread.lock().map_err(|e| e.to_string())?;
        *thread_handle = Some(watcher_thread);
    }

    info!("Process watcher started successfully");
    Ok(())
}

/// Stop watching for game process events
#[cfg(target_os = "windows")]
pub fn stop_watching<R: Runtime>(handle: AppHandle<R>) -> Result<(), String> {
    let state = handle.state::<ProcessWatcherState>();

    // Set watching flag to false to signal thread to stop
    {
        let mut watching = state.watching.lock().map_err(|e| e.to_string())?;
        if !*watching {
            info!("Process watcher not active");
            return Ok(());
        }
        *watching = false;
    }

    // Take the thread handle and wait for it to finish
    let thread_handle = {
        let mut thread_handle = state.watcher_thread.lock().map_err(|e| e.to_string())?;
        thread_handle.take()
    };

    if let Some(handle) = thread_handle {
        info!("Waiting for process watcher thread to finish...");
        if let Err(e) = handle.join() {
            error!("Process watcher thread panicked: {:?}", e);
            return Err("Process watcher thread panicked".to_string());
        }
        info!("Process watcher thread finished successfully");
    }

    info!("Process watcher stopped");
    Ok(())
}

/// Non-Windows stub implementations
#[cfg(not(target_os = "windows"))]
pub fn start_watching<R: Runtime>(_handle: AppHandle<R>) -> Result<(), String> {
    log::warn!("Process watcher is only supported on Windows");
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn stop_watching<R: Runtime>(_handle: AppHandle<R>) -> Result<(), String> {
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::is_game_exe_name;

    fn exe(name: &str) -> [u16; 260] {
        let mut buf = [0u16; 260];
        for (i, c) in name.encode_utf16().enumerate() {
            buf[i] = c;
        }
        buf
    }

    #[test]
    fn matches_game_exe_case_insensitively() {
        assert!(is_game_exe_name(&exe("RelicCoH3.exe")));
        assert!(is_game_exe_name(&exe("reliccoh3.exe")));
    }

    #[test]
    fn rejects_other_exes() {
        assert!(!is_game_exe_name(&exe("RelicCoH3.exe.bak")));
        assert!(!is_game_exe_name(&exe("RelicCoH2.exe")));
        assert!(!is_game_exe_name(&exe("")));
    }

    #[test]
    fn ignores_data_after_nul() {
        let mut buf = exe("RelicCoH3.exe");
        buf[20] = b'x' as u16;
        assert!(is_game_exe_name(&buf));
    }
}
