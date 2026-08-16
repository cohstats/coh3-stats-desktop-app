//! Tests for the in-game overlay geometry and edition gating.
//!
//! Pure maths and config reading - no Win32 calls - so these run on every platform
//! including CI.

use crate::game_overlay::geometry::{centre_in, overlay_rect, overlay_size, scale_for_dpi, Bounds};
use crate::game_overlay::is_ms_store_edition;

/// The overlay is a Microsoft Store only feature: the window must not be created in any
/// other build, and in the builds where it *is* created it must have its capability.
mod edition {
    use super::is_ms_store_edition;

    /// The config files carry bundle keys `tauri::Config` refuses (`packageName` and
    /// friends), so they are read as plain JSON rather than deserialised whole.
    fn raw_config(file: &str) -> serde_json::Value {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join(file);
        let raw = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{:?}: {}", path, e));
        serde_json::from_str(&raw).unwrap_or_else(|e| panic!("{:?}: {}", path, e))
    }

    /// A `tauri::Config` carrying only what `is_ms_store_edition` looks at.
    fn config_with_updater(create_updater_artifacts: serde_json::Value) -> tauri::Config {
        serde_json::from_value(serde_json::json!({
            "identifier": "com.coh3stats.desktop",
            "bundle": { "createUpdaterArtifacts": create_updater_artifacts },
        }))
        .expect("minimal config should deserialise")
    }

    #[test]
    fn a_build_that_ships_updater_artifacts_is_not_the_store_edition() {
        assert!(!is_ms_store_edition(&config_with_updater(
            serde_json::json!("v1Compatible")
        )));
        assert!(!is_ms_store_edition(&config_with_updater(
            serde_json::json!(true)
        )));
    }

    #[test]
    fn a_build_without_updater_artifacts_is_the_store_edition() {
        assert!(is_ms_store_edition(&config_with_updater(
            serde_json::json!(false)
        )));
    }

    /// The three real config files, checked the way the builds are actually configured:
    /// the store and Linux ones leave updating to the store, the default one does not.
    #[test]
    fn the_config_files_declare_the_editions_we_expect() {
        for (file, store_edition) in [
            ("tauri.conf.json", false),
            ("tauri.microsoftstore.conf.json", true),
            ("tauri.linux.conf.json", true),
        ] {
            let updater = raw_config(file)["bundle"]["createUpdaterArtifacts"].clone();
            assert_eq!(
                is_ms_store_edition(&config_with_updater(updater)),
                store_edition,
                "{} is on the wrong side of the store-edition gate",
                file
            );
        }
    }

    /// The overlay window only ever gets permissions through its own capability, and a
    /// per-build `capabilities` list replaces the default one rather than adding to it -
    /// so every config that creates the window has to name it.
    #[test]
    fn every_store_edition_config_grants_the_overlay_capability() {
        for file in [
            "tauri.conf.json",
            "tauri.microsoftstore.conf.json",
            "tauri.linux.conf.json",
        ] {
            let config = raw_config(file);
            let updater = config["bundle"]["createUpdaterArtifacts"].clone();
            if !is_ms_store_edition(&config_with_updater(updater)) {
                continue;
            }
            let capabilities = config["app"]["security"]["capabilities"]
                .as_array()
                .unwrap_or_else(|| panic!("{}: no app.security.capabilities", file));
            assert!(
                capabilities
                    .iter()
                    .any(|c| c.as_str() == Some("game-overlay-capabilities")),
                "{} enables the overlay but does not grant game-overlay-capabilities",
                file
            );
        }
    }
}

#[test]
fn scales_lengths_for_dpi() {
    assert_eq!(scale_for_dpi(100, 96), 100);
    assert_eq!(scale_for_dpi(100, 120), 125); // 125% scaling
    assert_eq!(scale_for_dpi(100, 144), 150); // 150% scaling
                                              // A bogus DPI of 0 must not collapse the overlay to nothing
    assert_eq!(scale_for_dpi(100, 0), 100);
}

#[test]
fn sizes_overlay_as_a_fraction_of_the_game_window() {
    let (w, h) = overlay_size(Bounds::new(0, 0, 1920, 1080), 96);
    assert_eq!(w, 1728); // 90%
    assert_eq!(h, 518); // 48%
}

#[test]
fn clamps_overlay_on_very_wide_and_very_small_windows() {
    // 5120 * 0.90 = 4608 -> clamped to the 2880 max
    let (w, _) = overlay_size(Bounds::new(0, 0, 5120, 1440), 96);
    assert_eq!(w, 2880);

    // 800 * 0.90 = 720 -> raised to the 840 min, but never wider than the game window
    let (w, h) = overlay_size(Bounds::new(0, 0, 800, 600), 96);
    assert_eq!(w, 800);
    assert_eq!(h, 312); // 288 raised to the min height

    // Tiny windowed game: overlay may not exceed the window itself
    let (w, h) = overlay_size(Bounds::new(0, 0, 400, 200), 96);
    assert_eq!(w, 400);
    assert_eq!(h, 200);
}

#[test]
fn clamps_are_dpi_scaled() {
    // At 150% the minimum width grows with the UI, so a 800px-wide game window
    // is fully covered rather than getting a narrow strip.
    let (w, _) = overlay_size(Bounds::new(0, 0, 800, 600), 144);
    assert_eq!(w, 800); // min 1260 capped to the game width
}

#[test]
fn centres_inside_the_game_window() {
    assert_eq!(
        centre_in(Bounds::new(0, 0, 1920, 1080), 1728, 518),
        (96, 281)
    );
    // Odd leftovers round down, they never go negative
    assert_eq!(centre_in(Bounds::new(0, 0, 101, 101), 100, 100), (0, 0));
}

#[test]
fn starts_at_the_vertical_middle_of_the_game_window() {
    let rect = overlay_rect(Bounds::new(0, 0, 1920, 1080), 96);
    assert_eq!(rect.y, 540); // top edge on the halfway line, not centred
    assert_eq!(rect.x, 96); // still horizontally centred

    // A short window where half + height would overflow gets pushed back up so the
    // overlay still fits: 400 * 0.48 = 192 raised to the 312 min, half is 200.
    let game = Bounds::new(0, 0, 1920, 400);
    let rect = overlay_rect(game, 96);
    assert_eq!(rect.y, 88);
    assert_eq!(rect.y + rect.height, game.height);
}

#[test]
fn centres_on_a_secondary_monitor_with_a_negative_origin() {
    // Monitor to the left of the primary: the game window origin is negative and the
    // overlay must follow it instead of landing on the primary screen.
    let game = Bounds::new(-1920, -200, 1920, 1080);
    let rect = overlay_rect(game, 96);
    // Horizontally centred, and starting at the vertical middle (-200 + 540).
    assert_eq!(rect, Bounds::new(-1824, 340, 1728, 518));
}

#[test]
fn overlay_never_spills_outside_the_game_window() {
    for game in [
        Bounds::new(0, 0, 1920, 1080),
        Bounds::new(100, 50, 1280, 720),
        Bounds::new(-2560, 0, 2560, 1440),
        Bounds::new(0, 0, 500, 300),
        Bounds::new(0, 0, 3840, 2160),
    ] {
        for dpi in [96, 120, 144, 192] {
            let rect = overlay_rect(game, dpi);
            assert!(rect.width > 0 && rect.height > 0, "{:?} @ {}", rect, dpi);
            assert!(rect.x >= game.x, "{:?} @ {} left of game", rect, dpi);
            assert!(rect.y >= game.y, "{:?} @ {} above game", rect, dpi);
            assert!(
                rect.x + rect.width <= game.x + game.width,
                "{:?} @ {} right of game",
                rect,
                dpi
            );
            assert!(
                rect.y + rect.height <= game.y + game.height,
                "{:?} @ {} below game",
                rect,
                dpi
            );
        }
    }
}
