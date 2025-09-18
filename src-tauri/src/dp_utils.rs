use serde::de::DeserializeOwned;
// COH3 Desktop App Utils
// use tauri_plugin_store::Store; // Unused for now
use log::{error};
use tauri::{AppHandle, Manager, Runtime};

pub fn load_from_store<R: Runtime, T: DeserializeOwned>(_handle: AppHandle<R>, _key: &str) -> Option<T> {
    // let _path = handle
    //     .path()
    //     .app_data_dir()
    //     .unwrap()
    //     .join("config.dat");

    // For now, return None as the Store API has changed significantly in v2
    // TODO: Implement proper store loading for Tauri v2
    error!("Store loading not yet implemented for Tauri v2");
    None
}
