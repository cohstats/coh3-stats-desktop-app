#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri_plugin_fs_watch::Watcher;
use std::path::Path;
use tauri::Manager;
use window_shadows::set_shadow;
mod parse_log_file;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_default_log_file_path, check_log_file_exists, parse_log_file::parse_log_file_reverse])
        .plugin(Watcher::default())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| { // Add window shadows
            let window = app.get_window("main").unwrap();
            set_shadow(&window, true).expect("Unsupported platform!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// returns the default expected log file path
#[tauri::command]
fn get_default_log_file_path() -> String {
    let mut path = tauri::api::path::document_dir().unwrap();
    path.push("My Games");
    path.push("Company of Heroes 3 - Playtest");
    path.push("warnings.log");
    path.display().to_string()
}

/// checks if log file can be found on system
#[tauri::command]
fn check_log_file_exists(path: &str) -> bool {
    Path::new(path).exists()
}