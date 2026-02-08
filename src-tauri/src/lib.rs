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
use tauri::Runtime;
use std::path::Path;
use std::thread;
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
    tauri_plugin_deep_link::prepare("com.coh3stats.desktop");

    // Add monitoring using sentry
    let _guard = sentry::init(("https://5a9a5418c06b995fe1c6221c83451612@o4504995920543744.ingest.sentry.io/4506676182646784", sentry::ClientOptions {
      release: sentry::release_name!(),
      ..Default::default()
    }));

    let builder = tauri::Builder::default()
        .manage(audio_manager::AudioManagerState::default())
        .manage(process_watcher::ProcessWatcherState::default())
        .plugin(tauri_plugin_log::Builder::new().build())
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
        .plugin(tauri_plugin_log::Builder::default().build())
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
        // You need to comment out this line to run the app on MacOS
        // do not compile on mac
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init())
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
    let handle_clone = handle.clone();
    if let Err(e) = tauri_plugin_deep_link::register("coh3stats", move |request| {
        if let Err(err) =
            tauri::async_runtime::block_on(cohdb::auth::retrieve_token(&request, &handle_clone))
        {
            error!("error retrieving cohdb token: {err}");
            sentry::capture_message(
                &format!("COHDB token retrieval error: {}", err),
                sentry::Level::Error,
            );
        }
    }) {
        error!("Failed to register deep link: {}", e);
        sentry::capture_message(
            &format!("Deep link registration error: {} (OS error - possibly permissions)", e),
            sentry::Level::Error,
        );
        // Don't fail the entire setup if deep link registration fails
        // This is likely the "Access is denied" error on some systems
        info!("Continuing without deep link support");
    }

    Ok(())
}

/// returns the default expected log file path
#[tauri::command]
fn default_log_file_path() -> Result<String, String> {
    let mut path = match dirs::document_dir() {
        Some(p) => p,
        None => {
            error!("Failed to get document directory: Directory not found");
            sentry::capture_message(
                "Document directory not found (log file path)",
                sentry::Level::Error,
            );
            return Err("Document directory not found. Please check your system permissions.".to_string());
        }
    };
    path.push("My Games"); // TODO: Is this "my games" also on non-English Windows?
    path.push("Company of Heroes 3");
    path.push("warnings.log");
    Ok(path.display().to_string())
}

#[tauri::command]
fn default_playback_path() -> Result<String, String> {
    let mut path = match dirs::document_dir() {
        Some(p) => p,
        None => {
            error!("Failed to get document directory: Directory not found");
            sentry::capture_message(
                "Document directory not found (playback path)",
                sentry::Level::Error,
            );
            return Err("Document directory not found. Please check your system permissions.".to_string());
        }
    };
    path.push("My Games"); // TODO: Is this "my games" also on non-English Windows?
    path.push("Company of Heroes 3");
    path.push("playback");
    Ok(path.display().to_string())
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
