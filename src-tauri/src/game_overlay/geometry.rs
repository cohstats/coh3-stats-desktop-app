//! Pure geometry helpers for the in-game overlay.
//!
//! Deliberately free of any Win32 call so they compile and unit-test everywhere.

/// A window rectangle in physical pixels.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Bounds {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

impl Bounds {
    pub fn new(x: i32, y: i32, width: i32, height: i32) -> Self {
        Self {
            x,
            y,
            width,
            height,
        }
    }
}

/// Fraction of the game window the overlay covers.
const WIDTH_RATIO: f64 = 0.55;
const HEIGHT_RATIO: f64 = 0.40;
/// Clamps at 96 DPI - scaled by the game window's DPI before being applied.
const MIN_WIDTH_96: i32 = 560;
const MAX_WIDTH_96: i32 = 1800;
const MIN_HEIGHT_96: i32 = 260;
const MAX_HEIGHT_96: i32 = 1000;

/// Scale a length expressed at 96 DPI to the given DPI.
pub fn scale_for_dpi(length_96: i32, dpi: u32) -> i32 {
    let dpi = if dpi == 0 { 96 } else { dpi };
    ((length_96 as f64) * (dpi as f64 / 96.0)).round() as i32
}

/// Overlay size for a game window of `game` size at `dpi`.
///
/// A fixed fraction of the game window, clamped to DPI-scaled min/max, and never
/// larger than the game window itself.
pub fn overlay_size(game: Bounds, dpi: u32) -> (i32, i32) {
    let min_w = scale_for_dpi(MIN_WIDTH_96, dpi);
    let max_w = scale_for_dpi(MAX_WIDTH_96, dpi);
    let min_h = scale_for_dpi(MIN_HEIGHT_96, dpi);
    let max_h = scale_for_dpi(MAX_HEIGHT_96, dpi);

    let w = ((game.width as f64 * WIDTH_RATIO).round() as i32).clamp(min_w.min(max_w), max_w);
    let h = ((game.height as f64 * HEIGHT_RATIO).round() as i32).clamp(min_h.min(max_h), max_h);

    // A tiny windowed game must not get an overlay bigger than itself.
    (w.min(game.width.max(1)), h.min(game.height.max(1)))
}

/// Centre a `w x h` rectangle inside `outer`.
pub fn centre_in(outer: Bounds, w: i32, h: i32) -> (i32, i32) {
    (
        outer.x + (outer.width - w) / 2,
        outer.y + (outer.height - h) / 2,
    )
}

/// Final overlay rectangle for a given game window: sized, centred, clamped so it
/// never spills outside the game window.
pub fn overlay_rect(game: Bounds, dpi: u32) -> Bounds {
    let (w, h) = overlay_size(game, dpi);
    let (x, y) = centre_in(game, w, h);
    let x = x.clamp(game.x, game.x + (game.width - w).max(0));
    let y = y.clamp(game.y, game.y + (game.height - h).max(0));
    Bounds::new(x, y, w, h)
}
