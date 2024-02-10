#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate machine_uid;

use coh3_stats_desktop_app::parse_log_file;
use log::{debug, error, info, warn};
use notify::Watcher;
use notify::{Config, RecommendedWatcher, RecursiveMode};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, Wry};
use tauri_plugin_log::LogTarget;
use tauri_plugin_store::{Store, StoreBuilder};
use vault::Replay;
use window_shadows::set_shadow;

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
        .plugin(tauri_plugin_cohdb::init(
            "kHERjpU_rXcvgvLgwPir0w3bqcgETLOH-p95-PVxN-M".to_string(),
            "coh3stats://cohdb.com/oauth/authorize".to_string(),
        ))
        .setup(setup)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();
    let mut store = StoreBuilder::new(handle, "config.dat".parse().unwrap()).build();
    if let Err(err) = store.load() {
        warn!("error loading store: {err}");
    }

    app.manage(State::new(store));

    // Add window shadows
    let window = app.get_window("main").unwrap();
    set_shadow(&window, true).expect("Unsupported platform!");

    // Set up deep link
    let handle = app.handle();
    tauri_plugin_deep_link::register("coh3stats", move |request| {
        let state = handle.state::<State>();
        tauri::async_runtime::block_on(tauri_plugin_cohdb::retrieve_token(&request, &handle))
            .unwrap();

        // Set up playback watcher
        let dir = playback_dir_from_store(state);
        watch_and_store(PathBuf::from(dir), handle.clone());
    })
    .unwrap();

    // Set up initial directory watcher
    let handle = app.handle();
    if tauri::async_runtime::block_on(tauri_plugin_cohdb::is_connected(app.handle())).is_some() {
        let state = handle.state::<State>();
        let dir = playback_dir_from_store(state);
        watch_and_store(PathBuf::from(dir), handle);
    }

    // Listen to store changes
    let handle = app.handle();
    let _id = app.listen_global("playback-dir-changed", move |event| {
        let dir: String = serde_json::from_str(event.payload().unwrap()).unwrap();

        info!("playback directory changed to {dir}");

        watch_and_store(PathBuf::from(dir), handle.clone());
    });

    Ok(())
}

fn watch_and_store(path: PathBuf, handle: AppHandle<Wry>) {
    let state = handle.state::<State>();
    let watcher = match watch_playback(path, handle.clone()) {
        Ok(watch) => Some(watch),
        Err(err) => {
            warn!("problem watching playback directory: {err}");
            None
        }
    };
    *state.playback_watcher.lock().unwrap() = watcher;
}

fn watch_playback(path: PathBuf, handle: AppHandle<Wry>) -> notify::Result<RecommendedWatcher> {
    let (tx, rx) = std::sync::mpsc::channel();

    let mut watcher = RecommendedWatcher::new(tx, Config::default())?;

    watcher.watch(&path, RecursiveMode::NonRecursive)?;

    tauri::async_runtime::spawn(async move {
        for res in rx {
            match res {
                Ok(event) => {
                    debug!("got file event: {event:?}");

                    if event.kind.is_create() || event.kind.is_modify() {
                        let path = event.paths[0].clone();
                        let bytes = match std::fs::read(path.clone()) {
                            Ok(buf) => buf,
                            Err(err) => {
                                error!("error reading file at {}: {err}", path.display());
                                continue;
                            }
                        };

                        if !bytes.is_empty() {
                            match Replay::from_bytes(&bytes) {
                                Ok(replay) => {
                                    if let Some(user) =
                                        tauri_plugin_cohdb::is_connected(handle.clone()).await
                                    {
                                        if !replay
                                            .players()
                                            .iter()
                                            .filter(|player| {
                                                player
                                                    .profile_id()
                                                    .is_some_and(|id| id == user.profile_id)
                                            })
                                            .collect::<Vec<_>>()
                                            .is_empty()
                                        {
                                            // naive check for skirmish games, they have very large values in this field
                                            // so we can use that to check and skip for now (need to add natively later)
                                            if replay.matchhistory_id() < 18446744073709551360 {
                                                if let Err(err) = tauri_plugin_cohdb::upload(
                                                    bytes,
                                                    format!("{}.rec", replay.matchhistory_id()),
                                                    handle.clone(),
                                                )
                                                    .await
                                                {
                                                    error!("error uploading replay: {err}");
                                                }
                                            } else {
                                                warn!("skirmish replay detected at {}, skipping", path.display());
                                            }
                                        } else {
                                            warn!("replay at {} does not include player with profile ID {}", path.display(), user.profile_id);
                                        }
                                    } else {
                                        debug!("cohdb user not connected, skipping upload");
                                    }
                                }
                                Err(err) => {
                                    warn!("error parsing replay at {}: {err}", path.display())
                                }
                            }
                        } else {
                            info!("skipping empty stub file {}", path.display());
                        }
                    }
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
