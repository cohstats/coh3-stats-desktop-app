//! Tests for the in-game overlay geometry.
//!
//! Pure maths only - no Win32 calls - so these run on every platform including CI.

use crate::game_overlay::geometry::{centre_in, overlay_rect, overlay_size, scale_for_dpi, Bounds};

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
    assert_eq!(w, 1056); // 55%
    assert_eq!(h, 432); // 40%
}

#[test]
fn clamps_overlay_on_very_wide_and_very_small_windows() {
    // 5120 * 0.55 = 2816 -> clamped to the 1800 max
    let (w, _) = overlay_size(Bounds::new(0, 0, 5120, 1440), 96);
    assert_eq!(w, 1800);

    // 800 * 0.55 = 440 -> raised to the 560 min, but never wider than the game window
    let (w, h) = overlay_size(Bounds::new(0, 0, 800, 600), 96);
    assert_eq!(w, 560);
    assert_eq!(h, 260); // 240 raised to the min height

    // Tiny windowed game: overlay may not exceed the window itself
    let (w, h) = overlay_size(Bounds::new(0, 0, 400, 200), 96);
    assert_eq!(w, 400);
    assert_eq!(h, 200);
}

#[test]
fn clamps_are_dpi_scaled() {
    // At 150% the minimum width grows with the UI, so a 800px-wide game window
    // is fully covered rather than getting a 560px strip.
    let (w, _) = overlay_size(Bounds::new(0, 0, 800, 600), 144);
    assert_eq!(w, 800); // min 840 capped to the game width
}

#[test]
fn centres_inside_the_game_window() {
    assert_eq!(centre_in(Bounds::new(0, 0, 1920, 1080), 1056, 432), (432, 324));
    // Odd leftovers round down, they never go negative
    assert_eq!(centre_in(Bounds::new(0, 0, 101, 101), 100, 100), (0, 0));
}

#[test]
fn centres_on_a_secondary_monitor_with_a_negative_origin() {
    // Monitor to the left of the primary: the game window origin is negative and the
    // overlay must follow it instead of landing on the primary screen.
    let game = Bounds::new(-1920, -200, 1920, 1080);
    let rect = overlay_rect(game, 96);
    assert_eq!(rect, Bounds::new(-1488, 124, 1056, 432));
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
