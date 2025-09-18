use serde::de::DeserializeOwned;
// COH3 Desktop App Utils
use log::{error, info};
use tauri::{AppHandle, Runtime, Manager};
use tauri_plugin_store::StoreExt;

pub fn load_from_store<R: Runtime, T: DeserializeOwned>(
    handle: AppHandle<R>,
    key: &str,
) -> Option<T> {
    // Get the app data directory path to match frontend behavior
    let app_data_path = match handle.path().app_data_dir() {
        Ok(path) => path,
        Err(e) => {
            error!("Failed to get app data directory: {}", e);
            return None;
        }
    };

    // Create the store path to match frontend: appDataPath + "config.dat"
    let store_path = app_data_path.join("config.dat");
    let store_path_str = match store_path.to_str() {
        Some(path) => path,
        None => {
            error!("Failed to convert store path to string");
            return None;
        }
    };

    // Get the store using the same path as the frontend
    let store = match handle.store(store_path_str) {
        Ok(store) => store,
        Err(e) => {
            error!("Failed to get store at path '{}': {}", store_path_str, e);
            return None;
        }
    };

    // Try to get the value from the store
    match store.get(key) {
        Some(value) => {
            // Try to deserialize the value
            match serde_json::from_value::<T>(value) {
                Ok(deserialized) => {
                    info!("Successfully loaded '{}' from store", key);
                    Some(deserialized)
                }
                Err(e) => {
                    error!("Failed to deserialize value for key '{}': {}", key, e);
                    None
                }
            }
        }
        None => {
            info!("Key '{}' not found in store", key);
            None
        }
    }
}
