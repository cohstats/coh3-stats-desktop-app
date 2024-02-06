#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate machine_uid;
use coh3_stats_desktop_app::parse_log_file;
use std::path::{Path, PathBuf};
use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode};
use notify::event::ModifyKind::Data;
use std::sync::Mutex;
use log::{error, info, warn};
use tauri::{Manager, Wry};
use tauri_plugin_log::LogTarget;
use window_shadows::set_shadow;
use notify::Watcher;
use tauri_plugin_deep_link::listen;
use tauri_plugin_store::{Store, StoreBuilder};

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

#[derive(Debug)]
struct State {
    store: Store<Wry>,
    playback_watcher: Mutex<Option<RecommendedWatcher>>,
}

impl State {
    pub fn new(store: Store<Wry>) -> Self {
        Self {
            store,
            playback_watcher: Mutex::new(None),
        }
    }
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
        ).plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
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
        .plugin(tauri_plugin_cohdb::init(
            "kHERjpU_rXcvgvLgwPir0w3bqcgETLOH-p95-PVxN-M".to_string(),
            "coh3stats://cohdb.com/oauth/authorize".to_string(),
        ))
        .setup(setup)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup<'a>(app: &'a mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();
    let mut store = StoreBuilder::new(handle, "config.dat".parse().unwrap()).build();
    if let Err(err) = store.load() {
        warn!("error loading store: {err}");
    }

    app.manage(State::new(store));

    let state = app.state::<State>();

    // Add window shadows
    let window = app.get_window("main").unwrap();
    set_shadow(&window, true).expect("Unsupported platform!");

    // Set up deep link
    let handle = app.handle();
    tauri_plugin_deep_link::register("coh3stats", move |request| {
        let state = handle.state::<State>();
        tauri::async_runtime::block_on(tauri_plugin_cohdb::retrieve_token(&request, &handle)).unwrap();

        // Set up playback watcher
        let dir = playback_dir_from_store(state.clone());
        watch_and_store(PathBuf::from(dir), state);
    }).unwrap();

    // Set up initial directory watcher
    if tauri::async_runtime::block_on(tauri_plugin_cohdb::is_connected(app.handle())) {
        let dir = playback_dir_from_store(state.clone());
        watch_and_store(PathBuf::from(dir), state.clone());
    }

    // Listen to store changes
    let handle = app.handle();
    let _id = app.listen_global("playback-dir-changed", move |event| {
        let state = handle.state::<State>();
        let dir: String = serde_json::from_str(event.payload().unwrap()).unwrap();

        info!("playback directory changed to {dir}");

        watch_and_store(PathBuf::from(dir), state);
    });

    Ok(())
}

fn watch_and_store(path: PathBuf, state: tauri::State<State>) {
    let watcher = match watch_playback(path) {
        Ok(watch) => Some(watch),
        Err(err) => {
            warn!("problem watching playback directory: {err}");
            None
        }
    };
    *state.playback_watcher.lock().unwrap() = watcher;
}

fn watch_playback(path: PathBuf) -> notify::Result<RecommendedWatcher> {
    let (tx, rx) = std::sync::mpsc::channel();

    let mut watcher = RecommendedWatcher::new(tx, Config::default())?;

    watcher.watch(&path, RecursiveMode::NonRecursive)?;

    tauri::async_runtime::spawn(async move {
        for res in rx {
            match res {
                Ok(event) => {
                    info!("got file event: {event:?}");
                }
                Err(error) => error!("file event error: {error:?}"),
            }
        }
    });

    Ok(watcher)
}

fn playback_dir_from_store(state: tauri::State<State>) -> String {
    if let Some(path) = state.store.get("playbackPath") {
        serde_json::from_value(path.clone()).unwrap()
    } else {
        default_playback_path()
    }
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
