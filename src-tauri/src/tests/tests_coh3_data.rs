use crate::coh3_data::*;
use std::fs;
use std::path::{Path, PathBuf};

fn temp_dir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("coh3-data-test-{}-{}", name, std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn test_valid_data_tags() {
    assert!(is_valid_data_tag("v3.0.3-1"));
    assert!(is_valid_data_tag("v1.0.7-4"));
    assert!(!is_valid_data_tag(""));
    assert!(!is_valid_data_tag(".."));
    assert!(!is_valid_data_tag("../evil"));
    assert!(!is_valid_data_tag("v3/../../x"));
    assert!(!is_valid_data_tag(r"v3\x"));
    assert!(!is_valid_data_tag("C:x"));
    assert!(!is_valid_data_tag(&"v".repeat(65)));
}

#[test]
fn test_normalize_locale() {
    assert_eq!(normalize_locale("en"), Some("en"));
    assert_eq!(normalize_locale("zh-Hans"), Some("zh-hans"));
    assert_eq!(normalize_locale(" DE "), Some("de"));
    assert_eq!(normalize_locale("ko"), Some("ko"));
    assert_eq!(normalize_locale("fr"), None);
    assert_eq!(normalize_locale("../en"), None);
}

#[test]
fn test_all_files() {
    assert_eq!(
        all_files(),
        vec![
            "ingame-tips.json",
            "mp-maps.json",
            "locales/en-locstring.json",
            "locales/zh-hans-locstring.json",
            "locales/de-locstring.json",
            "locales/ko-locstring.json",
        ]
    );
}

#[test]
fn test_urls_and_paths() {
    assert_eq!(
        data_file_url("v3.0.3-1", "locales/en-locstring.json"),
        "https://data.coh3stats.com/cohstats/coh3-data/v3.0.3-1/data/locales/en-locstring.json"
    );
    let root = Path::new("root");
    assert_eq!(
        cache_file_path(root, "v3.0.3-1", "locales/de-locstring.json"),
        root.join("v3.0.3-1")
            .join("locales")
            .join("de-locstring.json.gz")
    );
    assert_eq!(
        cache_file_path(root, "v3.0.3-1", "mp-maps.json"),
        root.join("v3.0.3-1").join("mp-maps.json.gz")
    );
}

#[test]
fn test_compress_roundtrip() {
    let json = r#"{"1":"%1X%.%2Y%","300":"Error","utf8":"中文 Ä 한국어"}"#.repeat(200);
    let compressed = compress(json.as_bytes()).unwrap();
    assert!(compressed.len() < json.len() / 5);
    assert_eq!(decompress_to_string(&compressed).unwrap(), json);
    assert!(decompress_to_string(b"not gzip").is_err());
}

#[test]
fn test_write_atomic() {
    let dir = temp_dir("atomic");
    let path = dir.join("a").join("b.json.gz");
    write_atomic(&path, b"first").unwrap();
    write_atomic(&path, b"second").unwrap();
    assert_eq!(fs::read(&path).unwrap(), b"second");
    assert!(!dir.join("a").join("b.json.gz.tmp").exists());
    fs::remove_dir_all(&dir).unwrap();
}

#[test]
fn test_newest_tag_and_cleanup() {
    let dir = temp_dir("tags");
    assert_eq!(newest_cached_tag(&dir), None);

    fs::create_dir_all(dir.join("v3.0.2-1")).unwrap();
    std::thread::sleep(std::time::Duration::from_millis(50));
    fs::create_dir_all(dir.join("v3.0.3-1")).unwrap();
    fs::create_dir_all(dir.join(".hidden")).unwrap();
    fs::write(dir.join("v9.9.9-9"), b"a file, not a tag folder").unwrap();

    assert_eq!(newest_cached_tag(&dir).as_deref(), Some("v3.0.3-1"));

    remove_other_tags(&dir, "v3.0.3-1");
    assert!(dir.join("v3.0.3-1").is_dir());
    assert!(!dir.join("v3.0.2-1").exists());
    // Things which don't look like our tag folders are left alone
    assert!(dir.join(".hidden").is_dir());
    assert!(dir.join("v9.9.9-9").is_file());

    fs::remove_dir_all(&dir).unwrap();
}

/// Hits data.coh3stats.com - run with `cargo test coh3_data -- --ignored`
#[test]
#[ignore]
fn test_download_and_cache_real_files() {
    let dir = temp_dir("network");
    let state = Coh3DataState::default();
    let client = http_client().unwrap();
    let tag = "v3.0.3-2";

    tauri::async_runtime::block_on(async {
        let path = ensure_cached(&state, &client, &dir, tag, "locales/en-locstring.json")
            .await
            .unwrap()
            .expect("en locstring exists");
        let json = decompress_to_string(&fs::read(&path).unwrap()).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["300"], "Error");

        // Cached now - served from the disk
        let again = ensure_cached(&state, &client, &dir, tag, "locales/en-locstring.json")
            .await
            .unwrap();
        assert_eq!(again, Some(path));

        let tips_path = ensure_cached(&state, &client, &dir, tag, "ingame-tips.json")
            .await
            .unwrap()
            .expect("ingame tips exist since v3.0.3-2");
        let tips: serde_json::Value =
            serde_json::from_str(&decompress_to_string(&fs::read(&tips_path).unwrap()).unwrap())
                .unwrap();
        assert!(!tips["tips"].as_array().unwrap().is_empty());

        // A file the tag doesn't ship (v3.0.3-1 had no ingame tips yet) is reported as
        // missing, not as an error
        let missing = ensure_cached(&state, &client, &dir, "v3.0.3-1", "ingame-tips.json")
            .await
            .unwrap();
        assert_eq!(missing, None);
    });

    fs::remove_dir_all(&dir).unwrap();
}
