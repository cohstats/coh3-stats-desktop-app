#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate machine_uid;

use coh3_stats_desktop_app::{parse_log_file, plugins::cohdb};
use log::error;
use std::path::Path;
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

    tauri::Builder::default()
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
        // .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(cohdb::auth::init(
            "kHERjpU_rXcvgvLgwPir0w3bqcgETLOH-p95-PVxN-M".to_string(),
            "coh3stats://cohdb.com/oauth/authorize".to_string(),
        ))
        .plugin(coh3_stats_desktop_app::plugins::cohdb::sync::init())
        .setup(setup)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Add window shadows
    let window = app.get_window("main").unwrap();
    set_shadow(&window, true).expect("Unsupported platform!");

    // Set up deep link
    let handle = app.handle();
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
    path.push("My Games");
    path.push("Company of Heroes 3");
    path.push("warnings.log");
    path.display().to_string()
}

#[tauri::command]
fn default_playback_path() -> String {
    let mut path = tauri::api::path::document_dir().unwrap();
    path.push("My Games");
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
