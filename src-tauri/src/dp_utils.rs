use serde::de::DeserializeOwned;
// COH3 Desktop App Utils
use tauri_plugin_store::{StoreCollection, with_store};
use log::{error};
use tauri::{AppHandle, Manager, Runtime};

pub fn load_from_store<R: Runtime, T: DeserializeOwned>(handle: AppHandle<R>, key: &str) -> Option<T> {
    let stores = handle.state::<StoreCollection<R>>();
    let path = handle
        .path_resolver()
        .app_data_dir()
        .unwrap()
        .join("config.dat");

    match with_store(handle.clone(), stores, path, |store| {
        Ok(store.get(key).cloned())
    }) {
        Ok(Some(value)) => match serde_json::from_value(value.clone()) {
            Ok(result) => Some(result),
            Err(err) => {
                error!("error deserializing store value at {key}: {err}");
                None
            }
        },
        Ok(None) => None,
        Err(err) => {
            error!("error retrieving store value at {key}: {err}");
            None
        }
    }
}