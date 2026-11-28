//! Downloads files of the coh3-data repository and keeps them in a disk cache.
//!
//! `https://data.coh3stats.com/cohstats/coh3-data/{dataTag}/data/{file}`
//!
//! The data tag of the latest patch comes from the map stats API (`latestPatchDataTag`, see
//! `map_stats.rs`). A file of a given data tag never changes, so once a file is on disk it is
//! never downloaded again. When a new data tag shows up, its files are downloaded and the
//! folders of the older tags are deleted.
//!
//! The files are stored gzip compressed (`<app cache dir>/coh3-data/{dataTag}/{file}.gz`) -
//! the locstring files shrink from ~4MB to under 1MB.
//!
//! Not every data tag ships every file (eg. `ingame-tips.json` is missing in older tags). A 404
//! is not an error: the file is reported as missing (`null` to the frontend) and the 404 is
//! remembered for the rest of the session.

use crate::config::{COH3_DATA_BASE_URL, COH3_DATA_CACHE_DIR};
use flate2::{read::GzDecoder, write::GzEncoder, Compression};
use log::{error, info, warn};
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::Duration;
use tauri::ipc::Response;
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tokio::sync::watch;

const REQUEST_TIMEOUT_SECS: u64 = 120;
/// How long a command waits for the data tag before giving up. The map stats request alone
/// may take up to 60 seconds.
const WAIT_FOR_TAG_SECS: u64 = 90;

/// Event emitted when all the files of the current data tag are cached.
pub const COH3_DATA_READY_EVENT: &str = "coh3-data-ready";

/// Files under `data/` which are downloaded for every data tag.
pub const DATA_FILES: &[&str] = &["ingame-tips.json", "mp-maps.json"];

/// Locales whose locstring files are downloaded (`data/locales/{locale}-locstring.json`).
pub const LOCALES: &[&str] = &["en", "zh-hans", "de", "ko"];

/// Where we are with the data tag.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DataTagStatus {
    /// Map stats are still being loaded.
    Pending,
    Ready(String),
    /// No data tag from the API and nothing in the disk cache.
    Unavailable,
}

pub struct Coh3DataState {
    tag: watch::Sender<DataTagStatus>,
    /// One lock per file, so the startup prefetch and a command never download the same file twice.
    download_locks: Mutex<HashMap<String, Arc<tokio::sync::Mutex<()>>>>,
    /// `{tag}/{file}` which returned 404 in this session.
    missing: Mutex<HashSet<String>>,
}

impl Default for Coh3DataState {
    fn default() -> Self {
        Self {
            tag: watch::channel(DataTagStatus::Pending).0,
            download_locks: Mutex::new(HashMap::new()),
            missing: Mutex::new(HashSet::new()),
        }
    }
}

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(|poisoned| {
        warn!("Coh3DataState mutex was poisoned, recovering");
        poisoned.into_inner()
    })
}

// ---------------------------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------------------------

/// The data tag comes from the network and ends up as a folder name - only allow what real tags
/// look like (`v3.0.3-1`), so it can never escape the cache folder.
pub fn is_valid_data_tag(tag: &str) -> bool {
    !tag.is_empty()
        && tag.len() <= 64
        && !tag.starts_with('.')
        && tag
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-' | '_'))
}

/// Normalizes a locale (`zh-Hans` -> `zh-hans`) and returns it when we download it.
pub fn normalize_locale(locale: &str) -> Option<&'static str> {
    let locale = locale.trim().to_ascii_lowercase();
    LOCALES.iter().copied().find(|l| *l == locale)
}

/// Path of a locstring file relative to `data/`.
pub fn locstring_file(locale: &str) -> String {
    format!("locales/{}-locstring.json", locale)
}

/// Every file (relative to `data/`) which is cached for a data tag.
pub fn all_files() -> Vec<String> {
    DATA_FILES
        .iter()
        .map(|f| f.to_string())
        .chain(LOCALES.iter().map(|l| locstring_file(l)))
        .collect()
}

pub fn data_file_url(tag: &str, file: &str) -> String {
    format!("{}/{}/data/{}", COH3_DATA_BASE_URL, tag, file)
}

/// `<root>/{tag}/{file}.gz`
pub fn cache_file_path(root: &Path, tag: &str, file: &str) -> PathBuf {
    let mut path = root.join(tag);
    for part in file.split('/') {
        path.push(part);
    }
    let file_name = format!(
        "{}.gz",
        path.file_name().unwrap_or_default().to_string_lossy()
    );
    path.set_file_name(file_name);
    path
}

pub fn compress(data: &[u8]) -> std::io::Result<Vec<u8>> {
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(data)?;
    encoder.finish()
}

pub fn decompress_to_string(data: &[u8]) -> std::io::Result<String> {
    let mut decoder = GzDecoder::new(data);
    let mut out = String::new();
    decoder.read_to_string(&mut out)?;
    Ok(out)
}

/// Writes through a temp file + rename, so a crash never leaves a half written file which
/// would then be treated as cached forever.
pub fn write_atomic(path: &Path, data: &[u8]) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut tmp = path.as_os_str().to_owned();
    tmp.push(".tmp");
    let tmp = PathBuf::from(tmp);
    fs::write(&tmp, data)?;
    fs::rename(&tmp, path).inspect_err(|_| {
        let _ = fs::remove_file(&tmp);
    })
}

/// The most recently modified data tag folder in the cache - used when we are offline.
pub fn newest_cached_tag(root: &Path) -> Option<String> {
    fs::read_dir(root)
        .ok()?
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().is_dir())
        .filter_map(|entry| {
            let name = entry.file_name().to_str()?.to_string();
            if !is_valid_data_tag(&name) {
                return None;
            }
            let modified = entry.metadata().ok()?.modified().ok()?;
            Some((modified, name))
        })
        .max()
        .map(|(_, name)| name)
}

/// Deletes the folders of all the data tags except `keep`.
pub fn remove_other_tags(root: &Path, keep: &str) {
    let Ok(entries) = fs::read_dir(root) else {
        return;
    };
    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        let name = entry.file_name();
        let Some(name) = name.to_str() else { continue };
        if path.is_dir() && name != keep && is_valid_data_tag(name) {
            match fs::remove_dir_all(&path) {
                Ok(()) => info!("Removed old coh3-data cache {}", name),
                Err(e) => warn!("Failed to remove old coh3-data cache {}: {}", name, e),
            }
        }
    }
}

// ---------------------------------------------------------------------------------------------
// Download + cache
// ---------------------------------------------------------------------------------------------

fn cache_root<R: Runtime>(handle: &AppHandle<R>) -> Result<PathBuf, String> {
    handle
        .path()
        .app_cache_dir()
        .map(|p| p.join(COH3_DATA_CACHE_DIR))
        .map_err(|e| format!("Could not determine app cache directory: {}", e))
}

pub(crate) fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .build()
        .map_err(|e| e.to_string())
}

/// Downloads the file. `Ok(None)` when the data tag doesn't have it (404).
pub(crate) async fn download(
    client: &reqwest::Client,
    url: &str,
) -> Result<Option<Vec<u8>>, String> {
    let response = client
        .get(url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Ok(None);
    }
    let response = response.error_for_status().map_err(|e| e.to_string())?;
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;

    // Never cache something which isn't valid JSON - it would stay in the cache forever.
    serde_json::from_slice::<serde::de::IgnoredAny>(&bytes)
        .map_err(|e| format!("Invalid JSON: {}", e))?;

    Ok(Some(bytes.to_vec()))
}

/// Makes sure the file is in the disk cache, downloading it when needed.
/// Returns the path of the cached file, or `None` when the data tag doesn't have the file.
pub(crate) async fn ensure_cached(
    state: &Coh3DataState,
    client: &reqwest::Client,
    root: &Path,
    tag: &str,
    file: &str,
) -> Result<Option<PathBuf>, String> {
    let path = cache_file_path(root, tag, file);
    let key = format!("{}/{}", tag, file);

    let is_known = || path.is_file() || lock(&state.missing).contains(&key);
    if is_known() {
        return Ok(path.is_file().then_some(path));
    }

    let file_lock = lock(&state.download_locks)
        .entry(key.clone())
        .or_default()
        .clone();
    let _guard = file_lock.lock().await;

    // Someone else may have downloaded it while we were waiting for the lock
    if is_known() {
        return Ok(path.is_file().then_some(path));
    }

    let url = data_file_url(tag, file);
    match download(client, &url).await? {
        Some(bytes) => {
            let compressed = compress(&bytes).map_err(|e| e.to_string())?;
            write_atomic(&path, &compressed).map_err(|e| e.to_string())?;
            info!(
                "Cached coh3-data {} ({} kB -> {} kB on disk)",
                key,
                bytes.len() / 1024,
                compressed.len() / 1024
            );
            Ok(Some(path))
        }
        None => {
            info!("coh3-data {} doesn't exist (404)", key);
            lock(&state.missing).insert(key);
            Ok(None)
        }
    }
}

/// Downloads every file of the data tag which isn't cached yet, then removes the old tags.
async fn prefetch<R: Runtime>(handle: AppHandle<R>, tag: String) {
    let (root, client) = match (cache_root(&handle), http_client()) {
        (Ok(root), Ok(client)) => (root, client),
        (Err(e), _) | (_, Err(e)) => {
            error!("Can't prefetch coh3-data: {}", e);
            return;
        }
    };

    let tasks: Vec<_> = all_files()
        .into_iter()
        .map(|file| {
            let (handle, client, root, tag) =
                (handle.clone(), client.clone(), root.clone(), tag.clone());
            tauri::async_runtime::spawn(async move {
                let state = handle.state::<Coh3DataState>();
                let result = ensure_cached(&state, &client, &root, &tag, &file).await;
                (file, result)
            })
        })
        .collect();

    let mut failed = false;
    for task in tasks {
        match task.await {
            Ok((_, Ok(_))) => {}
            Ok((file, Err(e))) => {
                failed = true;
                error!("Failed to cache coh3-data {}/{}: {}", tag, file, e);
                sentry::capture_message(
                    &format!("coh3-data download error {}/{}: {}", tag, file, e),
                    sentry::Level::Warning,
                );
            }
            Err(e) => {
                failed = true;
                error!("coh3-data prefetch task failed: {}", e);
            }
        }
    }

    // Only drop the old data once the new one is complete - it's the offline fallback.
    if failed {
        return;
    }
    remove_other_tags(&root, &tag);
    info!("coh3-data {} is cached", tag);
    if let Err(e) = handle.emit(COH3_DATA_READY_EVENT, &tag) {
        warn!("Failed to emit {}: {}", COH3_DATA_READY_EVENT, e);
    }
}

/// Called once the map stats are loaded (from the API or the cache). Picks the data tag and
/// starts downloading its files in the background.
pub fn on_map_stats<R: Runtime>(handle: &AppHandle<R>, map_stats: Option<&Value>) {
    let from_api = map_stats
        .and_then(|data| data.get("latestPatchDataTag"))
        .and_then(Value::as_str)
        .filter(|tag| {
            let valid = is_valid_data_tag(tag);
            if !valid {
                warn!("Ignoring invalid coh3-data tag {:?}", tag);
            }
            valid
        })
        .map(str::to_string);

    let tag = from_api.or_else(|| {
        let cached = cache_root(handle).ok().and_then(|r| newest_cached_tag(&r));
        if let Some(tag) = &cached {
            info!("No coh3-data tag from the API, using the cached {}", tag);
        }
        cached
    });

    let state = handle.state::<Coh3DataState>();
    match tag {
        Some(tag) => {
            info!("coh3-data tag: {}", tag);
            state.tag.send_replace(DataTagStatus::Ready(tag.clone()));
            tauri::async_runtime::spawn(prefetch(handle.clone(), tag));
        }
        None => {
            error!("No coh3-data tag available");
            state.tag.send_replace(DataTagStatus::Unavailable);
        }
    }
}

// ---------------------------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------------------------

async fn wait_for_tag(state: &Coh3DataState) -> Result<String, String> {
    let mut rx = state.tag.subscribe();
    let status = tokio::time::timeout(
        Duration::from_secs(WAIT_FOR_TAG_SECS),
        rx.wait_for(|s| *s != DataTagStatus::Pending),
    )
    .await
    .map_err(|_| "Timed out waiting for the coh3-data tag".to_string())?
    .map_err(|e| e.to_string())?
    .clone();

    match status {
        DataTagStatus::Ready(tag) => Ok(tag),
        _ => Err("The coh3-data tag is not available".to_string()),
    }
}

/// Returns the content of the file as JSON (parsed on the JS side, Rust only passes the text
/// through), or `null` when the data tag doesn't have the file.
async fn read_file<R: Runtime>(handle: &AppHandle<R>, file: &str) -> Result<Response, String> {
    let state = handle.state::<Coh3DataState>();
    let tag = wait_for_tag(&state).await?;
    let root = cache_root(handle)?;
    let client = http_client()?;

    let Some(path) = ensure_cached(&state, &client, &root, &tag, file).await? else {
        return Ok(Response::new("null".to_string()));
    };

    let read = || -> std::io::Result<String> { decompress_to_string(&fs::read(&path)?) };
    match read() {
        Ok(json) => Ok(Response::new(json)),
        Err(e) => {
            // Corrupted cache file - delete it, the next call downloads it again
            error!("Corrupted coh3-data cache {:?}: {}", path, e);
            let _ = fs::remove_file(&path);
            Err(format!("Failed to read cached {}: {}", file, e))
        }
    }
}

/// Data tag of the coh3-data files in use, `null` while it's not known yet.
#[tauri::command]
pub fn get_coh3_data_tag<R: Runtime>(handle: AppHandle<R>) -> Option<String> {
    match &*handle.state::<Coh3DataState>().tag.borrow() {
        DataTagStatus::Ready(tag) => Some(tag.clone()),
        _ => None,
    }
}

/// One of [`DATA_FILES`], eg. `invoke("get_coh3_data_file", { file: "mp-maps.json" })`.
#[tauri::command]
pub async fn get_coh3_data_file<R: Runtime>(
    handle: AppHandle<R>,
    file: String,
) -> Result<Response, String> {
    if !DATA_FILES.contains(&file.as_str()) {
        return Err(format!("Unknown coh3-data file {:?}", file));
    }
    read_file(&handle, &file).await
}

/// Locstring of one of [`LOCALES`], eg. `invoke("get_coh3_locstring", { locale: "de" })`.
#[tauri::command]
pub async fn get_coh3_locstring<R: Runtime>(
    handle: AppHandle<R>,
    locale: String,
) -> Result<Response, String> {
    let locale =
        normalize_locale(&locale).ok_or_else(|| format!("Unsupported locale {:?}", locale))?;
    read_file(&handle, &locstring_file(locale)).await
}
