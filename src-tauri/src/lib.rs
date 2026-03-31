#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate machine_uid;

mod audio_manager;
mod config;
mod dp_utils;
mod overlay_server;
mod parse_log_file;
mod plugins;
mod process_watcher;
#[cfg(test)]
mod tests;

use config::{COHDB_CLIENT_ID, COHDB_REDIRECT_URI};
use dp_utils::load_from_store;
use log::{error, info};
use overlay_server::run_http_server;
use plugins::cohdb;
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
    // Add monitoring using sentry
    let _guard = sentry::init(("https://5a9a5418c06b995fe1c6221c83451612@o4504995920543744.ingest.sentry.io/4506676182646784", sentry::ClientOptions {
      release: sentry::release_name!(),
      ..Default::default()
    }));

    let builder = tauri::Builder::default()
        .manage(audio_manager::AudioManagerState::default())
        .manage(process_watcher::ProcessWatcherState::default())
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
            cohdb_authenticate,
            cohdb_connected,
            cohdb_disconnect,
            enable_audio_muting,
            disable_audio_muting,
            update_audio_mute_settings,
            start_process_watcher,
            stop_process_watcher
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
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(cohdb::auth::init(
            COHDB_CLIENT_ID.to_string(),
            COHDB_REDIRECT_URI.to_string(),
        ))
        .plugin(plugins::cohdb::sync::init());

    #[cfg(not(target_os = "macos"))]
    let builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());

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

    // Set up sync handling
    // This needs to happen here because it depends on other plugins
    cohdb::sync::setup(handle.clone());

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

    // Set up deep link - don't fail setup if this fails
    use tauri_plugin_deep_link::DeepLinkExt;

    // Register the deep link scheme at runtime for desktop platforms
    #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
    {
        if let Err(e) = handle.deep_link().register("coh3stats") {
            error!("Failed to register deep link scheme: {}", e);
            sentry::capture_message(
                &format!("Deep link scheme registration error: {} (OS error - possibly permissions)", e),
                sentry::Level::Error,
            );
            info!("Continuing without deep link support");
        }
    }

    // Set up deep link event handler
    let handle_clone = handle.clone();
    handle.deep_link().on_open_url(move |event| {
        for url in event.urls() {
            if let Err(err) =
                tauri::async_runtime::block_on(cohdb::auth::retrieve_token(url.as_str(), &handle_clone))
            {
                error!("error retrieving cohdb token: {err}");
                sentry::capture_message(
                    &format!("COHDB token retrieval error: {}", err),
                    sentry::Level::Error,
                );
            }
        }
    });

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
                "Game directory not found (playback path)",
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
    }

    Err("OS not supported.".to_string())
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

// Wrapper functions for cohdb plugin commands
#[tauri::command]
async fn cohdb_authenticate<R: Runtime>(handle: AppHandle<R>) -> Result<String, String> {
    cohdb::auth::authenticate(handle).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cohdb_connected<R: Runtime>(handle: AppHandle<R>) -> Result<Option<cohdb::auth::responses::User>, String> {
    cohdb::auth::connected(handle).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cohdb_disconnect<R: Runtime>(handle: AppHandle<R>) -> Result<(), String> {
    cohdb::auth::disconnect(handle).await.map_err(|e| e.to_string())
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

#[cfg(test)]
mod lib_tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::Mutex;

    static ENV_MUTEX: Mutex<()> = Mutex::new(());

    /// Creates a uniquely-named temp directory under the OS temp folder.
    /// The `label` makes the name human-readable when debugging failures.
    fn make_temp_dir(label: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "coh3_test_{}_{}",
            label,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .subsec_nanos()
        ));
        fs::create_dir_all(&dir).expect("Failed to create temp test directory");
        dir
    }

    // =========================================================================
    // Linux-specific tests
    //
    // Strategy for "mocking" path.exists():
    //   dirs::data_local_dir() on Linux resolves $XDG_DATA_HOME before
    //   falling back to $HOME/.local/share. By pointing $XDG_DATA_HOME at a
    //   temp dir we control the entire base path that get_game_path() builds
    //   on, so creating/omitting directories is equivalent to mocking
    //   path.exists() returning true/false.
    // =========================================================================
    #[cfg(target_os = "linux")]
    mod linux {
        use super::*;

        /// Builds the expected CoH3 directory inside a fake Steam compatdata layout.
        fn coh3_dir_in(base: &PathBuf, session_id: &str) -> PathBuf {
            base.join("Steam/steamapps/compatdata")
                .join(session_id)
                .join("pfx/drive_c/users/steamuser/Documents/My Games/Company of Heroes 3")
        }

        // --- default_log_file_path -------------------------------------------

        #[test]
        fn test_default_log_file_path_ok_when_warnings_log_exists() {
            let _lock = ENV_MUTEX.lock().unwrap();
            let tmp = make_temp_dir("log_ok");

            let coh3 = coh3_dir_in(&tmp, "12345678");
            fs::create_dir_all(&coh3).unwrap();
            // Mock path.exists() == true for warnings.log by creating the file
            fs::write(coh3.join("warnings.log"), b"[INFO] game started").unwrap();
            std::env::set_var("XDG_DATA_HOME", &tmp);

            let result = default_log_file_path();

            // Clean up before asserting so the env is always restored
            fs::remove_dir_all(&tmp).ok();
            std::env::remove_var("XDG_DATA_HOME");

            assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
            assert!(
                result.unwrap().ends_with("warnings.log"),
                "Returned path should end with warnings.log"
            );
        }

        #[test]
        fn test_default_log_file_path_err_when_warnings_log_missing() {
            let _lock = ENV_MUTEX.lock().unwrap();
            let tmp = make_temp_dir("log_missing");

            // CoH3 dir exists but warnings.log does NOT → path.exists() == false
            let coh3 = coh3_dir_in(&tmp, "12345678");
            fs::create_dir_all(&coh3).unwrap();
            std::env::set_var("XDG_DATA_HOME", &tmp);

            let result = default_log_file_path();

            fs::remove_dir_all(&tmp).ok();
            std::env::remove_var("XDG_DATA_HOME");

            assert!(result.is_err());
            let err = result.unwrap_err();
            assert!(
                err.contains("warnings.log"),
                "Error should mention the missing file, got: \"{}\"",
                err
            );
        }

        #[test]
        fn test_default_log_file_path_err_when_game_dir_not_found() {
            let _lock = ENV_MUTEX.lock().unwrap();
            let tmp = make_temp_dir("no_game_dir");

            // No Steam directory → get_game_path() fails
            // get_game_path_with_sub_path remaps that error to a fixed message
            std::env::set_var("XDG_DATA_HOME", &tmp);

            let result = default_log_file_path();

            fs::remove_dir_all(&tmp).ok();
            std::env::remove_var("XDG_DATA_HOME");

            assert!(result.is_err());
            assert_eq!(
                result.unwrap_err(),
                "Game directory not found. Please check your system permissions."
            );
        }

        // --- get_game_path --------------------------------------------------

        #[test]
        fn test_get_game_path_ok_when_coh3_dir_exists() {
            let _lock = ENV_MUTEX.lock().unwrap();
            let tmp = make_temp_dir("game_path_ok");

            let coh3 = coh3_dir_in(&tmp, "12345678");
            fs::create_dir_all(&coh3).unwrap();
            std::env::set_var("XDG_DATA_HOME", &tmp);

            let result = get_game_path();

            fs::remove_dir_all(&tmp).ok();
            std::env::remove_var("XDG_DATA_HOME");

            assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
            assert_eq!(result.unwrap(), coh3);
        }

        #[test]
        fn test_get_game_path_err_when_steam_compatdata_missing() {
            let _lock = ENV_MUTEX.lock().unwrap();
            let tmp = make_temp_dir("no_steam");

            // tmp exists but Steam/steamapps/compatdata does NOT
            // → path.exists() on the compatdata dir returns false
            std::env::set_var("XDG_DATA_HOME", &tmp);

            let result = get_game_path();

            fs::remove_dir_all(&tmp).ok();
            std::env::remove_var("XDG_DATA_HOME");

            assert!(result.is_err());
            assert!(
                result
                    .unwrap_err()
                    .contains("Steam compatdata directory not found"),
                "Error message should mention Steam compatdata"
            );
        }

        #[test]
        fn test_get_game_path_err_when_no_session_contains_coh3() {
            let _lock = ENV_MUTEX.lock().unwrap();
            let tmp = make_temp_dir("no_coh3_session");

            // A session directory exists, but it belongs to a different game
            let other_game = tmp
                .join("Steam/steamapps/compatdata/99999")
                .join("pfx/drive_c/users/steamuser/Documents/My Games/OtherGame");
            fs::create_dir_all(&other_game).unwrap();
            std::env::set_var("XDG_DATA_HOME", &tmp);

            let result = get_game_path();

            fs::remove_dir_all(&tmp).ok();
            std::env::remove_var("XDG_DATA_HOME");

            // All sessions exhausted without a match → falls through to Err
            assert!(result.is_err());
        }

        #[test]
        fn test_get_game_path_finds_coh3_among_multiple_sessions() {
            let _lock = ENV_MUTEX.lock().unwrap();
            let tmp = make_temp_dir("multi_session");

            // Session 11111 → different game (path.exists() == false for CoH3)
            let other = tmp
                .join("Steam/steamapps/compatdata/11111")
                .join("pfx/drive_c/users/steamuser/Documents/My Games/SomeOtherGame");
            fs::create_dir_all(&other).unwrap();

            // Session 22222 → CoH3 (path.exists() == true)
            let coh3 = coh3_dir_in(&tmp, "22222");
            fs::create_dir_all(&coh3).unwrap();

            std::env::set_var("XDG_DATA_HOME", &tmp);

            let result = get_game_path();

            fs::remove_dir_all(&tmp).ok();
            std::env::remove_var("XDG_DATA_HOME");

            assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
            assert_eq!(result.unwrap(), coh3);
        }
    }

    // =========================================================================
    // Windows-specific tests
    //
    // dirs::document_dir() calls the Win32 API (SHGetKnownFolderPath) and
    // cannot be overridden via an env var. These tests therefore validate
    // structural guarantees (correct path segments) and the error contract
    // (non-empty, descriptive message) rather than injecting a fake path.
    // =========================================================================
    #[cfg(target_os = "windows")]
    mod windows {
        use super::*;

        #[test]
        fn test_get_game_path_contains_expected_path_segments() {
            let result = get_game_path();
            match result {
                Ok(path) => {
                    let s = path.to_string_lossy();
                    assert!(s.contains("My Games"), "Path should contain 'My Games'");
                    assert!(
                        s.contains("Company of Heroes 3"),
                        "Path should contain 'Company of Heroes 3'"
                    );
                }
                Err(e) => {
                    // Acceptable in CI environments where Documents dir is absent
                    assert!(!e.is_empty(), "Error message must not be empty");
                }
            }
        }

        #[test]
        fn test_default_log_file_path_ok_path_has_correct_structure() {
            let result = default_log_file_path();
            match result {
                Ok(path) => {
                    assert!(
                        path.ends_with("warnings.log"),
                        "Path should end with warnings.log, got: {}",
                        path
                    );
                    assert!(
                        path.contains("Company of Heroes 3"),
                        "Path should contain 'Company of Heroes 3'"
                    );
                }
                Err(e) => {
                    // Game not installed or log file does not exist → still valid
                    assert!(!e.is_empty(), "Error message must not be empty");
                }
            }
        }

        #[test]
        fn test_default_log_file_path_err_when_log_absent() {
            // When the game is not installed the function must return Err,
            // not panic. We can only assert the contract here since we
            // cannot force the path to be absent on an arbitrary Windows machine.
            let result = default_log_file_path();
            if let Err(e) = result {
                assert!(!e.is_empty(), "Error message must not be empty");
            }
        }
    }

    // =========================================================================
    // Cross-platform contract tests — no filesystem side effects
    // These run on every OS and pin the public API contract of
    // default_log_file_path regardless of whether the game is installed.
    // =========================================================================

    #[test]
    fn test_default_log_file_path_return_type_is_result_string() {
        // Compile-time shape check: function must return Result<String, String>
        let result: Result<String, String> = default_log_file_path();
        if let Ok(path) = result {
            assert!(
                !path.is_empty(),
                "Success value must not be an empty string"
            );
        }
    }

    #[test]
    fn test_default_log_file_path_error_message_is_descriptive() {
        let result = default_log_file_path();
        if let Err(e) = result {
            assert!(!e.is_empty(), "Error message must not be empty");
            let is_descriptive = e.contains("not found")
                || e.contains("warnings.log")
                || e.contains("directory")
                || e.contains("permissions");
            assert!(
                is_descriptive,
                "Error should describe what went wrong, got: \"{}\"",
                e
            );
        }
    }
}
