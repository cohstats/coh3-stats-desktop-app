use crate::{default_log_file_path, get_game_path};

// =========================================================================
// Linux-specific tests
//
// Strategy for "mocking" path.exists():
//   dirs::data_local_dir() on Linux resolves $XDG_DATA_HOME before
//   falling back to $HOME/.local/share. By pointing $XDG_DATA_HOME at a
//   temp dir we control the entire base path that get_game_path() builds
//   on, so creating/omitting directories is equivalent to mocking
//   path.exists() returning true/false.
// =========================================================================
#[cfg(target_os = "linux")]
mod linux {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::Mutex;

    static ENV_MUTEX: Mutex<()> = Mutex::new(());

    /// Creates a uniquely-named temp directory under the OS temp folder.
    /// The `label` makes the name human-readable when debugging failures.
    fn make_temp_dir(label: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "coh3_test_{}_{}",
            label,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .subsec_nanos()
        ));
        fs::create_dir_all(&dir).expect("Failed to create temp test directory");
        dir
    }

    /// Builds the expected CoH3 directory inside a fake Steam compatdata layout.
    fn coh3_dir_in(base: &PathBuf, session_id: &str) -> PathBuf {
        base.join("Steam/steamapps/compatdata")
            .join(session_id)
            .join("pfx/drive_c/users/steamuser/Documents/My Games/Company of Heroes 3")
    }

    // --- default_log_file_path -------------------------------------------

    #[test]
    fn test_default_log_file_path_ok_when_warnings_log_exists() {
        let _lock = ENV_MUTEX.lock().unwrap();
        let tmp = make_temp_dir("log_ok");

        let coh3 = coh3_dir_in(&tmp, "12345678");
        fs::create_dir_all(&coh3).unwrap();
        // Mock path.exists() == true for warnings.log by creating the file
        fs::write(coh3.join("warnings.log"), b"[INFO] game started").unwrap();
        std::env::set_var("XDG_DATA_HOME", &tmp);

        let result = default_log_file_path();

        // Clean up before asserting so the env is always restored
        fs::remove_dir_all(&tmp).ok();
        std::env::remove_var("XDG_DATA_HOME");

        assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
        assert!(
            result.unwrap().ends_with("warnings.log"),
            "Returned path should end with warnings.log"
        );
    }

    #[test]
    fn test_default_log_file_path_err_when_warnings_log_missing() {
        let _lock = ENV_MUTEX.lock().unwrap();
        let tmp = make_temp_dir("log_missing");

        // CoH3 dir exists but warnings.log does NOT → path.exists() == false
        let coh3 = coh3_dir_in(&tmp, "12345678");
        fs::create_dir_all(&coh3).unwrap();
        std::env::set_var("XDG_DATA_HOME", &tmp);

        let result = default_log_file_path();

        fs::remove_dir_all(&tmp).ok();
        std::env::remove_var("XDG_DATA_HOME");

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("warnings.log"),
            "Error should mention the missing file, got: \"{}\"",
            err
        );
    }

    #[test]
    fn test_default_log_file_path_err_when_game_dir_not_found() {
        let _lock = ENV_MUTEX.lock().unwrap();
        let tmp = make_temp_dir("no_game_dir");

        // No Steam directory → get_game_path() fails
        // get_game_path_with_sub_path remaps that error to a fixed message
        std::env::set_var("XDG_DATA_HOME", &tmp);

        let result = default_log_file_path();

        fs::remove_dir_all(&tmp).ok();
        std::env::remove_var("XDG_DATA_HOME");

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            "Game directory not found. Please check your system permissions."
        );
    }

    // --- get_game_path --------------------------------------------------

    #[test]
    fn test_get_game_path_ok_when_coh3_dir_exists() {
        let _lock = ENV_MUTEX.lock().unwrap();
        let tmp = make_temp_dir("game_path_ok");

        let coh3 = coh3_dir_in(&tmp, "12345678");
        fs::create_dir_all(&coh3).unwrap();
        std::env::set_var("XDG_DATA_HOME", &tmp);

        let result = get_game_path();

        fs::remove_dir_all(&tmp).ok();
        std::env::remove_var("XDG_DATA_HOME");

        assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
        assert_eq!(result.unwrap(), coh3);
    }

    #[test]
    fn test_get_game_path_err_when_steam_compatdata_missing() {
        let _lock = ENV_MUTEX.lock().unwrap();
        let tmp = make_temp_dir("no_steam");

        // tmp exists but Steam/steamapps/compatdata does NOT
        // → path.exists() on the compatdata dir returns false
        std::env::set_var("XDG_DATA_HOME", &tmp);

        let result = get_game_path();

        fs::remove_dir_all(&tmp).ok();
        std::env::remove_var("XDG_DATA_HOME");

        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .contains("Steam compatdata directory not found"),
            "Error message should mention Steam compatdata"
        );
    }

    #[test]
    fn test_get_game_path_err_when_no_session_contains_coh3() {
        let _lock = ENV_MUTEX.lock().unwrap();
        let tmp = make_temp_dir("no_coh3_session");

        // A session directory exists, but it belongs to a different game
        let other_game = tmp
            .join("Steam/steamapps/compatdata/99999")
            .join("pfx/drive_c/users/steamuser/Documents/My Games/OtherGame");
        fs::create_dir_all(&other_game).unwrap();
        std::env::set_var("XDG_DATA_HOME", &tmp);

        let result = get_game_path();

        fs::remove_dir_all(&tmp).ok();
        std::env::remove_var("XDG_DATA_HOME");

        // All sessions exhausted without a match → falls through to Err
        assert!(result.is_err());
    }

    #[test]
    fn test_get_game_path_finds_coh3_among_multiple_sessions() {
        let _lock = ENV_MUTEX.lock().unwrap();
        let tmp = make_temp_dir("multi_session");

        // Session 11111 → different game (path.exists() == false for CoH3)
        let other = tmp
            .join("Steam/steamapps/compatdata/11111")
            .join("pfx/drive_c/users/steamuser/Documents/My Games/SomeOtherGame");
        fs::create_dir_all(&other).unwrap();

        // Session 22222 → CoH3 (path.exists() == true)
        let coh3 = coh3_dir_in(&tmp, "22222");
        fs::create_dir_all(&coh3).unwrap();

        std::env::set_var("XDG_DATA_HOME", &tmp);

        let result = get_game_path();

        fs::remove_dir_all(&tmp).ok();
        std::env::remove_var("XDG_DATA_HOME");

        assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
        assert_eq!(result.unwrap(), coh3);
    }
}

// =========================================================================
// Windows-specific tests
//
// dirs::document_dir() calls the Win32 API (SHGetKnownFolderPath) and
// cannot be overridden via an env var. These tests therefore validate
// structural guarantees (correct path segments) and the error contract
// (non-empty, descriptive message) rather than injecting a fake path.
// =========================================================================
#[cfg(target_os = "windows")]
mod windows {
    use super::*;

    #[test]
    fn test_get_game_path_contains_expected_path_segments() {
        let result = get_game_path();
        match result {
            Ok(path) => {
                let s = path.to_string_lossy();
                assert!(s.contains("My Games"), "Path should contain 'My Games'");
                assert!(
                    s.contains("Company of Heroes 3"),
                    "Path should contain 'Company of Heroes 3'"
                );
            }
            Err(e) => {
                // Acceptable in CI environments where Documents dir is absent
                assert!(!e.is_empty(), "Error message must not be empty");
            }
        }
    }

    #[test]
    fn test_default_log_file_path_ok_path_has_correct_structure() {
        let result = default_log_file_path();
        match result {
            Ok(path) => {
                assert!(
                    path.ends_with("warnings.log"),
                    "Path should end with warnings.log, got: {}",
                    path
                );
                assert!(
                    path.contains("Company of Heroes 3"),
                    "Path should contain 'Company of Heroes 3'"
                );
            }
            Err(e) => {
                // Game not installed or log file does not exist → still valid
                assert!(!e.is_empty(), "Error message must not be empty");
            }
        }
    }

    #[test]
    fn test_default_log_file_path_err_when_log_absent() {
        // When the game is not installed the function must return Err,
        // not panic. We can only assert the contract here since we
        // cannot force the path to be absent on an arbitrary Windows machine.
        let result = default_log_file_path();
        if let Err(e) = result {
            assert!(!e.is_empty(), "Error message must not be empty");
        }
    }
}

// =========================================================================
// Cross-platform contract tests — no filesystem side effects
// These run on every OS and pin the public API contract of
// default_log_file_path regardless of whether the game is installed.
// =========================================================================

#[test]
fn test_default_log_file_path_return_type_is_result_string() {
    // Compile-time shape check: function must return Result<String, String>
    let result: Result<String, String> = default_log_file_path();
    if let Ok(path) = result {
        assert!(
            !path.is_empty(),
            "Success value must not be an empty string"
        );
    }
}

#[test]
fn test_default_log_file_path_error_message_is_descriptive() {
    let result = default_log_file_path();
    if let Err(e) = result {
        assert!(!e.is_empty(), "Error message must not be empty");
        let is_descriptive = e.contains("not found")
            || e.contains("warnings.log")
            || e.contains("directory")
            || e.contains("permissions");
        assert!(
            is_descriptive,
            "Error should describe what went wrong, got: \"{}\"",
            e
        );
    }
}
