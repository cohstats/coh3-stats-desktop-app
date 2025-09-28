use serde::de::DeserializeOwned;
// COH3 Desktop App Utils
use log::{error, info};
use tauri::{AppHandle, Runtime, Manager};
use tauri_plugin_store::StoreExt;

pub fn load_from_store<R: Runtime, T: DeserializeOwned>(
    handle: AppHandle<R>,
    key: &str,
) -> Option<T> {
    // In Tauri v2, use relative path "config.dat" to match frontend behavior
    let store = match handle.store("config.dat") {
        Ok(store) => store,
        Err(e) => {
            error!("Failed to get store 'config.dat': {}", e);
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
