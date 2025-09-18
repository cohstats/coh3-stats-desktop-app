use serde::de::DeserializeOwned;
// COH3 Desktop App Utils
use log::error;
use tauri::{AppHandle, Runtime};

pub fn load_from_store<R: Runtime, T: DeserializeOwned>(
    _handle: AppHandle<R>,
    _key: &str,
) -> Option<T> {
    // Store API is now handled on the frontend side with tauri-plugin-store
    // This function is kept for compatibility but should not be used
    // The frontend should use the Store API directly
    error!("Store loading should be handled on the frontend side in Tauri v2");
    None
}
