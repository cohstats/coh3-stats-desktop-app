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

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn main() {
    tauri_plugin_deep_link::prepare("com.coh3stats.desktop");

    // Add monitoring using sentry
    // Monitoring is disabled on MacOS because we do only development on MacOS
    // if you want to recieve sentry events on MacOS, remove the cfg attribute
    #[cfg(not(target_os = "macos"))]
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
            let window = app.get_window("main").unwrap();
            window.set_focus().ok();
            window
                .request_user_attention(Some(tauri::UserAttentionType::Informational))
                .ok();

            //println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
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
        .expect("error while running tauri application");
}

fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    if load_from_store(handle.clone(), "streamerOverlayEnabled").unwrap_or(false) {
        info!("Streamer overlay server is enabled");
        let mut file_path = handle.path_resolver().app_data_dir().unwrap();
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
    let window = app.get_window("main").unwrap();
    set_shadow(&window, true).expect("Unsupported platform!");

    // Set up deep link
    tauri_plugin_deep_link::register("coh3stats", move |request| {
        if let Err(err) =
            tauri::async_runtime::block_on(cohdb::auth::retrieve_token(&request, &handle))
        {
            error!("error retrieving cohdb token: {err}");
        }
    })
    .unwrap();

    Ok(())
}

/// returns the default expected log file path
#[tauri::command]
fn default_log_file_path() -> String {
    let mut path = tauri::api::path::document_dir().unwrap();
    path.push("My Games"); // TODO: Is this "my games" also on non-English Windows?
    path.push("Company of Heroes 3");
    path.push("warnings.log");
    path.display().to_string()
}

#[tauri::command]
fn default_playback_path() -> String {
    let mut path = tauri::api::path::document_dir().unwrap();
    path.push("My Games"); // TODO: Is this "my games" also on non-English Windows?
    path.push("Company of Heroes 3");
    path.push("playback");
    path.display().to_string()
}

/// checks if log file can be found on system
#[tauri::command]
fn check_path_exists(path: &str) -> bool {
    Path::new(path).exists()
}

/// get the system machine id
#[tauri::command]
fn get_machine_id() -> String {
    machine_uid::get().unwrap()
}
