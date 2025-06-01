#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate machine_uid;

use coh3_stats_desktop_app::config::{COHDB_CLIENT_ID, COHDB_REDIRECT_URI};
use coh3_stats_desktop_app::dp_utils::load_from_store;
use coh3_stats_desktop_app::{overlay_server::run_http_server, parse_log_file, plugins::cohdb};
use log::{error, info};
use std::path::Path;
use std::thread;
use tauri::Manager;
use tauri_plugin_log::LogTarget;
use window_shadows::set_shadow;
use std::process;
use tauri::api::dialog::{MessageDialogBuilder, MessageDialogKind};

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn main() {
    tauri_plugin_deep_link::prepare("com.coh3stats.desktop");

    // Add monitoring using sentry
    let _guard = sentry::init(("https://5a9a5418c06b995fe1c6221c83451612@o4504995920543744.ingest.sentry.io/4506676182646784", sentry::ClientOptions {
      release: sentry::release_name!(),
      ..Default::default()
    }));

    let builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            default_log_file_path,
            default_playback_path,
            check_path_exists,
            get_machine_id,
            parse_log_file::parse_log_file_reverse
        ])
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout])
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            let window = match app.get_window("main") {
                Some(w) => w,
                None => {
                    error!("Failed to get main window: Window not found");
                    process::exit(1);
                }
            };

            if let Err(e) = window.set_focus() {
                error!("Failed to set window focus: {}", e);
                sentry::capture_message(&format!("Window focus error: {}", e), sentry::Level::Error);
            }

            if let Err(e) = window.request_user_attention(Some(tauri::UserAttentionType::Informational)) {
                error!("Failed to request user attention: {}", e);
                sentry::capture_message(&format!("User attention error: {}", e), sentry::Level::Error);
            }

            if let Err(e) = app.emit_all("single-instance", Payload { args: argv, cwd }) {
                error!("Failed to emit single-instance event: {}", e);
                sentry::capture_message(&format!("Single instance event error: {}", e), sentry::Level::Error);
            }
        }))
        .plugin(tauri_plugin_fs_watch::init())
        // You need to comment out this line to run the app on MacOS
        // do not compile on mac
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(cohdb::auth::init(
            COHDB_CLIENT_ID.to_string(),
            COHDB_REDIRECT_URI.to_string(),
        ))
        .plugin(coh3_stats_desktop_app::plugins::cohdb::sync::init());

    #[cfg(not(target_os = "macos"))]
    let builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());

    builder
        .setup(setup)
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            error!("Failed to run Tauri application: {}", e);
            sentry::capture_message(&format!("Tauri application error: {}", e), sentry::Level::Error);

            // Show system dialog to inform user about the failure
            use std::sync::{Arc, Mutex};
            use std::time::Duration;

            let dialog_closed = Arc::new(Mutex::new(false));
            let dialog_closed_clone = dialog_closed.clone();

            let _ = MessageDialogBuilder::new(
                "COH3 Stats Desktop App - Startup Error",
                &format!(
                    "The COH3 Stats Desktop App failed to start.\n\nError: {}\n\nPlease try the following:\n• Restart the application\n• Restart you computer\n• Check troubleshooting guide on coh3stats.com/desktop-app\n• Contact support on Discord if the problem persists",
                    e
                )
            )
            .kind(MessageDialogKind::Error)
            .show(move |_| {
                let mut closed = dialog_closed_clone.lock().unwrap();
                *closed = true;
            });

            // Wait for the dialog to be closed or timeout after 60 seconds
            let start_time = std::time::Instant::now();
            while start_time.elapsed() < Duration::from_secs(60) {
                {
                    let closed = dialog_closed.lock().unwrap();
                    if *closed {
                        break;
                    }
                }
                std::thread::sleep(Duration::from_millis(100));
            }
        });
}

fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    if load_from_store(handle.clone(), "streamerOverlayEnabled").unwrap_or(false) {
        info!("Streamer overlay server is enabled");
        let mut file_path = match handle.path_resolver().app_data_dir() {
            Some(path) => path,
            None => {
                error!("Failed to get app data directory: Directory not found");
                return Err("App data directory not found".into());
            }
        };
        file_path.push("streamerOverlay.html");
        info!("Expecting the streamerOverlay at {:?}", file_path);

        let _handle = thread::spawn(|| {
            run_http_server(file_path);
        });
    } else {
        info!("Streamer overlay server is disabled");
    }

    // Set up sync handling
    // This needs to happen here because it depends on other plugins
    cohdb::sync::setup(handle.clone());

    // Add window shadows
    let window = match app.get_window("main") {
        Some(w) => w,
        None => {
            error!("Failed to get main window: Window not found");
            return Err("Main window not found".into());
        }
    };

    if let Err(e) = set_shadow(&window, true) {
        error!("Failed to set window shadow: {}", e);
        sentry::capture_message(&format!("Window shadow error: {}", e), sentry::Level::Error);
    }

    // Set up deep link
    tauri_plugin_deep_link::register("coh3stats", move |request| {
        if let Err(err) = tauri::async_runtime::block_on(cohdb::auth::retrieve_token(&request, &handle)) {
            error!("error retrieving cohdb token: {err}");
            sentry::capture_message(&format!("COHDB token retrieval error: {}", err), sentry::Level::Error);
        }
    })
    .map_err(|e| {
        error!("Failed to register deep link: {}", e);
        sentry::capture_message(&format!("Deep link registration error: {}", e), sentry::Level::Error);
        e
    })?;

    Ok(())
}

/// returns the default expected log file path
#[tauri::command]
fn default_log_file_path() -> Result<String, String> {
    let mut path = match tauri::api::path::document_dir() {
        Some(p) => p,
        None => {
            error!("Failed to get document directory: Directory not found");
            return Err("Document directory not found".to_string());
        }
    };
    path.push("My Games"); // TODO: Is this "my games" also on non-English Windows?
    path.push("Company of Heroes 3");
    path.push("warnings.log");
    Ok(path.display().to_string())
}

#[tauri::command]
fn default_playback_path() -> Result<String, String> {
    let mut path = match tauri::api::path::document_dir() {
        Some(p) => p,
        None => {
            error!("Failed to get document directory: Directory not found");
            return Err("Document directory not found".to_string());
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
