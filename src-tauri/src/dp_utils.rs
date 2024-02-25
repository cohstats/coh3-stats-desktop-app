use std::path::PathBuf;

// COH3 Desktop App Utils
use tauri_plugin_store::{Store, StoreBuilder};
use log::{info, warn};
use tauri::{AppHandle, Runtime};


pub fn load_store<R: Runtime>(handle: AppHandle<R>) -> Store<R> {
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


// This is stupid I can't figure out how to return different types from a function and work with it correctly :'(
// fn get_value_from_store<R: Runtime>(store: &Store<R>, key: String) -> Option<Result<String, bool>> {
//     match store.get(key) {
//         Some(value) => {
//             Some(serde_json::from_value(value.clone()).map_err(|_| false))
//         },
//         None => None,
//     }
// }


pub fn is_streamer_overlay_enabled<R: Runtime>(store: &Store<R>) -> bool {
    match store.get("streamerOverlayEnabled".to_string()) {
        Some(value) => serde_json::from_value(value.clone()).unwrap_or(false),
        None => false,
    }
}