use crate::config::{BATTLEGROUP_INFO_API_URL, BATTLEGROUP_INFO_CACHE_FILENAME};
use log::{error, info, warn};
use serde_json::Value;
use std::fs;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager, Runtime};

const REQUEST_TIMEOUT_SECS: u64 = 60;
const CACHE_MAX_AGE_HOURS: u64 = 12;

/// State for storing battlegroup info data
#[derive(Debug, Default)]
pub struct BattlegroupInfoState {
    pub data: Mutex<Option<Value>>,
}

/// Fetches battlegroup info from the API
pub async fn fetch_battlegroup_info() -> Result<Value, reqwest::Error> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .build()?;

    let response = client
        .get(BATTLEGROUP_INFO_API_URL)
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
        p.push(BATTLEGROUP_INFO_CACHE_FILENAME);
        p
    })
}

/// Saves battlegroup info data to cache file
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

/// Loads battlegroup info data from cache file
pub fn load_from_cache<R: Runtime>(handle: &AppHandle<R>) -> Option<Value> {
    let path = get_cache_path(handle)?;
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str(&content).ok()
}

/// Checks if the cache file is older than the maximum age
pub fn is_cache_stale<R: Runtime>(handle: &AppHandle<R>) -> bool {
    let max_age = Duration::from_secs(CACHE_MAX_AGE_HOURS * 60 * 60);

    let Some(path) = get_cache_path(handle) else {
        return true; // No path means we should fetch
    };

    let Ok(metadata) = fs::metadata(&path) else {
        return true; // File doesn't exist or can't be read
    };

    let Ok(modified) = metadata.modified() else {
        return true; // Can't get modification time
    };

    let Ok(elapsed) = modified.elapsed() else {
        return true; // Time went backwards somehow
    };

    elapsed > max_age
}

/// Helper to safely lock the mutex, recovering from poison if needed
fn lock_state_data(state: &BattlegroupInfoState) -> std::sync::MutexGuard<'_, Option<Value>> {
    state.data.lock().unwrap_or_else(|poisoned| {
        warn!("BattlegroupInfoState mutex was poisoned, recovering");
        poisoned.into_inner()
    })
}

/// Initializes battlegroup info fetching (non-blocking, called from setup)
pub fn init_battlegroup_info<R: Runtime>(handle: AppHandle<R>) {
    tauri::async_runtime::spawn(async move {
        let state = handle.state::<BattlegroupInfoState>();

        // Check if cache is fresh (less than 12 hours old)
        if !is_cache_stale(&handle) {
            if let Some(cached_data) = load_from_cache(&handle) {
                info!(
                    "Loaded battlegroup info from fresh cache (less than {} hours old)",
                    CACHE_MAX_AGE_HOURS
                );
                *lock_state_data(&state) = Some(cached_data);
                return;
            }
        }

        // Cache is stale or doesn't exist, fetch from API
        match fetch_battlegroup_info().await {
            Ok(data) => {
                info!("Successfully fetched battlegroup info from API");
                // Save to cache
                if let Err(e) = save_to_cache(&handle, &data) {
                    error!("Failed to save battlegroup info to cache: {}", e);
                    sentry::capture_message(
                        &format!("Battlegroup info cache save error: {}", e),
                        sentry::Level::Warning,
                    );
                }
                *lock_state_data(&state) = Some(data);
            }
            Err(e) => {
                error!("Failed to fetch battlegroup info from API: {}", e);
                sentry::capture_message(
                    &format!("Battlegroup info API fetch error: {}", e),
                    sentry::Level::Error,
                );

                // Try to load from cache (even if stale, better than nothing)
                if let Some(cached_data) = load_from_cache(&handle) {
                    info!("Loaded battlegroup info from stale cache after API failure");
                    *lock_state_data(&state) = Some(cached_data);
                } else {
                    error!("Failed to load battlegroup info from cache");
                    sentry::capture_message(
                        "Battlegroup info cache load failed after API failure",
                        sentry::Level::Error,
                    );
                }
            }
        }
    });
}

/// Tauri command to get battlegroup info data
#[tauri::command]
pub fn get_battlegroup_info<R: Runtime>(handle: AppHandle<R>) -> Option<Value> {
    let state = handle.state::<BattlegroupInfoState>();
    let data = lock_state_data(&state).clone();
    data
}

