use std::{path::PathBuf, sync::Mutex};

use auth::responses::User;
use log::{debug, error, info, warn};
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle, EventHandler, Manager, Runtime,
};
use tauri_plugin_store::{Store, StoreBuilder};
use vault::{GameType, Replay};

use super::auth;

#[derive(Debug)]
pub struct State<R: Runtime> {
    playback_watcher: Mutex<Option<RecommendedWatcher>>,
    store: Store<R>,
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("cohdbsync")
        .invoke_handler(tauri::generate_handler![])
        .setup(|app| {
            let store = load_store(app.clone());
            let path = PathBuf::from(load_playback_path(&store));
            let watcher = init_watcher(path, app.clone());

            app.manage(State {
                playback_watcher: Mutex::new(watcher),
                store,
            });

            listen_for_changes(app.clone());

            Ok(())
        })
        .build()
}

pub fn listen_for_changes<R: Runtime>(handle: AppHandle<R>) -> EventHandler {
    let handle_ = handle.clone();
    handle.listen_global("playback-dir-changed", move |event| {
        let dir: String = serde_json::from_str(event.payload().unwrap()).unwrap();

        info!("playback directory changed to {dir}");

        *handle_.state::<State<R>>().playback_watcher.lock().unwrap() =
            init_watcher(PathBuf::from(dir), handle_.clone());
    })
}

fn watch<R: Runtime>(path: PathBuf, handle: AppHandle<R>) -> notify::Result<RecommendedWatcher> {
    let (tx, rx) = std::sync::mpsc::channel();

    let mut watcher = RecommendedWatcher::new(tx, Config::default())?;

    watcher.watch(&path, RecursiveMode::NonRecursive)?;

    tauri::async_runtime::spawn(async move {
        for res in rx {
            match res {
                Ok(event) => {
                    debug!("got file event: {event:?}");

                    if event.kind.is_modify() {
                        handle_modify_event(event, handle.clone()).await;
                    }
                }
                Err(error) => error!("file event error: {error:?}"),
            }
        }
    });

    Ok(watcher)
}

async fn handle_modify_event<R: Runtime>(event: Event, handle: AppHandle<R>) {
    let Some(user) = auth::connected_user(handle.clone()).await else {
        info!("cohdb user not connected, skipping sync");
        return;
    };

    if let Some(enabled) = handle.state::<State<R>>().store.get("autoSyncReplays") {
        if !serde_json::from_value::<bool>(enabled.clone()).unwrap() {
            info!("auto-sync disabled, skipping sync");
            return;
        }
    }

    let path = event.paths[0].clone();
    let bytes = match std::fs::read(path.clone()) {
        Ok(buf) => buf,
        Err(err) => {
            error!("error reading file at {}: {err}", path.display());
            return;
        }
    };

    match Replay::from_bytes(&bytes) {
        Ok(replay) => {
            if !includes_user(&replay, &user) {
                warn!(
                    "replay at {} does not include player with profile ID {:?}",
                    path.display(),
                    user.profile_id
                );
                return;
            }

            if replay.game_type() == GameType::Skirmish {
                warn!("skirmish replay detected at {}, skipping", path.display());
                return;
            }

            if let Err(err) = auth::upload(
                bytes,
                format!("{}.rec", replay.matchhistory_id().unwrap()),
                handle.clone(),
            )
            .await
            {
                error!("error uploading replay: {err}");
            }
        }
        Err(err) => {
            warn!("error parsing replay at {}: {err}", path.display())
        }
    }
}

fn includes_user(replay: &Replay, user: &User) -> bool {
    replay
        .players()
        .iter()
        .any(|player| player.profile_id().is_some() && player.profile_id() == user.profile_id)
}

fn load_store<R: Runtime>(handle: AppHandle<R>) -> Store<R> {
    let mut store = StoreBuilder::new(handle, PathBuf::from("config.dat")).build();

    if let Err(err) = store.load() {
        warn!("error loading store from disk: {err}");
        info!("saving store file to disk");
        if let Err(err) = store.save() {
            warn!("error saving store file to disk: {err}");
        }
    }

    store
}

fn load_playback_path<R: Runtime>(store: &Store<R>) -> String {
    if let Some(path) = store.get("playbackPath") {
        serde_json::from_value(path.clone()).unwrap()
    } else {
        default_playback_path()
    }
}

fn init_watcher<R: Runtime>(path: PathBuf, handle: AppHandle<R>) -> Option<RecommendedWatcher> {
    match watch(path, handle.clone()) {
        Ok(watcher) => Some(watcher),
        Err(err) => {
            error!("problem watching playback directory: {err}");
            None
        }
    }
}

fn default_playback_path() -> String {
    let mut path = tauri::api::path::document_dir().unwrap();
    path.push("My Games");
    path.push("Company of Heroes 3");
    path.push("playback");
    path.display().to_string()
}
