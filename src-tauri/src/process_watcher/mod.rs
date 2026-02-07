//! Process Watcher Module
//!
//! This module provides unified monitoring for the game process, handling both
//! process detection and audio muting based on foreground state.
//!
//! It uses a single polling-based approach that checks every 1 second for:
//! - Game process existence
//! - Foreground window state
//! - Audio mute/unmute based on settings

use log::{error, info, debug};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use tauri::{AppHandle, Manager, Runtime};

#[cfg(target_os = "windows")]
mod unified_monitor;

#[cfg(target_os = "windows")]
use windows::Win32::System::ProcessStatus::{EnumProcesses, GetModuleBaseNameW};
#[cfg(target_os = "windows")]
use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};

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

/// Find the game process ID by searching for the game process
#[cfg(target_os = "windows")]
pub fn find_game_process_id() -> Option<u32> {
    unsafe {
        let mut pids: [u32; 1024] = [0; 1024];
        let mut bytes_returned: u32 = 0;

        if !EnumProcesses(
            pids.as_mut_ptr(),
            (pids.len() * std::mem::size_of::<u32>()) as u32,
            &mut bytes_returned,
        )
        .is_ok()
        {
            error!("Failed to enumerate processes");
            return None;
        }

        let num_processes = bytes_returned as usize / std::mem::size_of::<u32>();

        for i in 0..num_processes {
            let pid = pids[i];
            if pid == 0 {
                continue;
            }

            if let Ok(handle) = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, pid)
            {
                let mut name_buffer: [u16; 260] = [0; 260];
                let len = GetModuleBaseNameW(handle, None, &mut name_buffer);

                if len > 0 {
                    let name = String::from_utf16_lossy(&name_buffer[..len as usize]);
                    if name.to_lowercase() == GAME_PROCESS_NAME {
                        debug!("Found game process: {} (PID: {})", name, pid);
                        return Some(pid);
                    }
                }
            }
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

