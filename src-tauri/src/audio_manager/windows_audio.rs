//! Windows Audio Control Module
//!
//! This module provides Windows-specific functionality for muting/unmuting
//! game audio using the Windows Core Audio API (WASAPI).

use log::{info, warn};

use windows::core::Interface;
use windows::Win32::Media::Audio::{
    eMultimedia, eRender, IAudioSessionControl, IAudioSessionControl2, IAudioSessionEnumerator,
    IAudioSessionManager2, IMMDevice, IMMDeviceEnumerator, ISimpleAudioVolume, MMDeviceEnumerator,
};
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_ALL, COINIT_MULTITHREADED,
};

/// Set the mute state for the game's audio session
pub fn set_game_mute(game_pid: u32, mute: bool) -> Result<(), String> {
    unsafe {
        // Initialize COM - only uninitialize if we successfully initialized it
        // CoInitializeEx returns S_OK if this is the first call on this thread,
        // or S_FALSE if COM is already initialized. We only uninitialize if we
        // got S_OK, maintaining proper reference counting.
        let com_init_result = CoInitializeEx(None, COINIT_MULTITHREADED);
        let should_uninit = com_init_result.is_ok();

        let result = set_game_mute_internal(game_pid, mute);

        // Only uninitialize COM if we successfully initialized it
        if should_uninit {
            CoUninitialize();
        }

        result
    }
}

/// Internal function to set game mute (COM must be initialized)
unsafe fn set_game_mute_internal(game_pid: u32, mute: bool) -> Result<(), String> {
    // Create device enumerator
    let enumerator: IMMDeviceEnumerator = CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)
        .map_err(|e| format!("Failed to create device enumerator: {}", e))?;

    // Get default audio endpoint
    let device: IMMDevice = enumerator
        .GetDefaultAudioEndpoint(eRender, eMultimedia)
        .map_err(|e| format!("Failed to get default audio endpoint: {}", e))?;

    // Activate session manager using IMMDevice::Activate
    // Note: We must use Activate() instead of cast() because IMMDevice doesn't
    // directly implement IAudioSessionManager2 - it needs to be activated.
    let session_manager: IAudioSessionManager2 = device
        .Activate::<IAudioSessionManager2>(CLSCTX_ALL, None)
        .map_err(|e| format!("Failed to activate IAudioSessionManager2: {}", e))?;

    // Get session enumerator
    let session_enumerator: IAudioSessionEnumerator = session_manager
        .GetSessionEnumerator()
        .map_err(|e| format!("Failed to get session enumerator: {}", e))?;

    // Get session count
    let session_count = session_enumerator
        .GetCount()
        .map_err(|e| format!("Failed to get session count: {}", e))?;

    // Find the game's audio session
    for i in 0..session_count {
        let session: IAudioSessionControl = session_enumerator
            .GetSession(i)
            .map_err(|e| format!("Failed to get session {}: {}", i, e))?;

        // Get session control 2 for process ID
        let session2: IAudioSessionControl2 = session
            .cast()
            .map_err(|e| format!("Failed to cast to IAudioSessionControl2: {}", e))?;

        // Get process ID
        let session_pid = session2
            .GetProcessId()
            .map_err(|e| format!("Failed to get session process ID: {}", e))?;

        if session_pid == game_pid {
            // Found the game's session - get volume control
            let volume: ISimpleAudioVolume = session
                .cast()
                .map_err(|e| format!("Failed to cast to ISimpleAudioVolume: {}", e))?;

            // Set mute state
            volume
                .SetMute(mute, std::ptr::null())
                .map_err(|e| format!("Failed to set mute state: {}", e))?;

            info!(
                "Game audio {} (PID: {})",
                if mute { "muted" } else { "unmuted" },
                game_pid
            );
            return Ok(());
        }
    }

    warn!("Game audio session not found for PID: {}", game_pid);
    Err("Game audio session not found".to_string())
}

