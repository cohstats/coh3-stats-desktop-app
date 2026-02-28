use crate::config::{MAP_STATS_API_URL, MAP_STATS_CACHE_FILENAME};
use log::{error, info, warn};
use serde_json::Value;
use std::fs;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager, Runtime};

const REQUEST_TIMEOUT_SECS: u64 = 60;

/// State for storing map stats data
#[derive(Debug, Default)]
pub struct MapStatsState {
    pub data: Mutex<Option<Value>>,
}

/// Fetches map stats from the API
pub async fn fetch_map_stats() -> Result<Value, reqwest::Error> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .build()?;

    let response = client
        .get(MAP_STATS_API_URL)
        .header("Accept-Encoding", "gzip, deflate, br")
        .header("Accept", "application/json")
        .send()
        .await?
        .error_for_status()?;

    response.json::<Value>().await
}

/// Gets the cache file path
pub fn get_cache_path<R: Runtime>(handle: &AppHandle<R>) -> Option<std::path::PathBuf> {
    handle.path().app_data_dir().ok().map(|mut p| {
        p.push(MAP_STATS_CACHE_FILENAME);
        p
    })
}

/// Saves map stats data to cache file
pub fn save_to_cache<R: Runtime>(
    handle: &AppHandle<R>,
    data: &Value,
) -> Result<(), std::io::Error> {
    let path = get_cache_path(handle).ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Could not determine app data directory for cache",
        )
    })?;

    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let json_string = serde_json::to_string(data)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
    fs::write(path, json_string)
}

/// Loads map stats data from cache file
pub fn load_from_cache<R: Runtime>(handle: &AppHandle<R>) -> Option<Value> {
    let path = get_cache_path(handle)?;
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str(&content).ok()
}

/// Helper to safely lock the mutex, recovering from poison if needed
fn lock_state_data(state: &MapStatsState) -> std::sync::MutexGuard<'_, Option<Value>> {
    state.data.lock().unwrap_or_else(|poisoned| {
        warn!("MapStatsState mutex was poisoned, recovering");
        poisoned.into_inner()
    })
}

/// Initializes map stats fetching (non-blocking, called from setup)
pub fn init_map_stats<R: Runtime>(handle: AppHandle<R>) {
    tauri::async_runtime::spawn(async move {
        let state = handle.state::<MapStatsState>();

        // Try to fetch from API
        match fetch_map_stats().await {
            Ok(data) => {
                info!("Successfully fetched map stats from API");
                // Save to cache
                if let Err(e) = save_to_cache(&handle, &data) {
                    error!("Failed to save map stats to cache: {}", e);
                    sentry::capture_message(
                        &format!("Map stats cache save error: {}", e),
                        sentry::Level::Warning,
                    );
                }
                *lock_state_data(&state) = Some(data);
            }
            Err(e) => {
                error!("Failed to fetch map stats from API: {}", e);
                sentry::capture_message(
                    &format!("Map stats API fetch error: {}", e),
                    sentry::Level::Error,
                );

                // Try to load from cache
                if let Some(cached_data) = load_from_cache(&handle) {
                    info!("Loaded map stats from cache");
                    *lock_state_data(&state) = Some(cached_data);
                } else {
                    error!("Failed to load map stats from cache");
                    sentry::capture_message(
                        "Map stats cache load failed after API failure",
                        sentry::Level::Error,
                    );
                }
            }
        }
    });
}

/// Tauri command to get map stats data
#[tauri::command]
pub fn get_map_stats<R: Runtime>(handle: AppHandle<R>) -> Option<Value> {
    let state = handle.state::<MapStatsState>();
    let data = lock_state_data(&state).clone();
    data
}

