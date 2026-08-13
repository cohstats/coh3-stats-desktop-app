//! Win32 window lookup and inspection for the in-game overlay.
//!
//! HWNDs are passed around as `isize` because `HWND` is not `Send` - the watcher
//! thread needs to carry one across ticks.

use super::geometry::Bounds;

#[cfg(target_os = "windows")]
mod imp {
    use super::Bounds;
    use log::debug;
    use std::ffi::c_void;
    use windows::core::BOOL;
    use windows::Win32::Foundation::{HWND, LPARAM, RECT};
    use windows::Win32::Graphics::Dwm::{DwmGetWindowAttribute, DWMWA_EXTENDED_FRAME_BOUNDS};
    use windows::Win32::UI::HiDpi::GetDpiForWindow;
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetForegroundWindow, GetWindowLongPtrW, GetWindowRect,
        GetWindowThreadProcessId, IsIconic, IsWindowVisible, SetWindowLongPtrW, SetWindowPos,
        GWL_EXSTYLE, HWND_TOPMOST, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SWP_SHOWWINDOW,
        WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW, WS_EX_TRANSPARENT,
    };

    struct EnumCtx {
        pid: u32,
        /// best candidate so far: (hwnd, area)
        best: Option<(isize, i64)>,
    }

    unsafe extern "system" fn enum_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let ctx = &mut *(lparam.0 as *mut EnumCtx);

        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid != ctx.pid || !IsWindowVisible(hwnd).as_bool() {
            return BOOL(1); // keep enumerating
        }

        let mut rect = RECT::default();
        if GetWindowRect(hwnd, &mut rect).is_ok() {
            let area = (rect.right - rect.left) as i64 * (rect.bottom - rect.top) as i64;
            if area > 0 && ctx.best.map_or(true, |(_, best)| area > best) {
                ctx.best = Some((hwnd.0 as isize, area));
            }
        }

        BOOL(1)
    }

    /// Largest visible top-level window belonging to `pid` - the game's render window.
    pub fn find_window_for_pid(pid: u32) -> Option<isize> {
        let mut ctx = EnumCtx { pid, best: None };
        unsafe {
            // We never stop the enumeration early, so an Err here means a genuine
            // failure - which simply leaves `best` as None.
            let _ = EnumWindows(Some(enum_proc), LPARAM(&mut ctx as *mut EnumCtx as isize));
        }
        ctx.best.map(|(hwnd, _)| hwnd)
    }

    /// Window bounds in physical pixels.
    ///
    /// Prefers the DWM extended frame bounds - `GetWindowRect` includes the invisible
    /// resize border on Win10+, which offsets a centred overlay by a few pixels.
    pub fn get_window_bounds(hwnd_raw: isize) -> Option<Bounds> {
        let hwnd = HWND(hwnd_raw as *mut c_void);
        unsafe {
            let mut rect = RECT::default();
            let dwm_ok = DwmGetWindowAttribute(
                hwnd,
                DWMWA_EXTENDED_FRAME_BOUNDS,
                &mut rect as *mut RECT as *mut c_void,
                std::mem::size_of::<RECT>() as u32,
            )
            .is_ok()
                && rect.right > rect.left
                && rect.bottom > rect.top;

            if !dwm_ok {
                rect = RECT::default();
                GetWindowRect(hwnd, &mut rect).ok()?;
            }

            if rect.right <= rect.left || rect.bottom <= rect.top {
                return None;
            }

            Some(Bounds::new(
                rect.left,
                rect.top,
                rect.right - rect.left,
                rect.bottom - rect.top,
            ))
        }
    }

    /// Process owning the foreground window, if a *real* window holds it.
    ///
    /// `None` means "cannot tell, assume nothing changed". That covers the null HWND
    /// `GetForegroundWindow` returns while activation is changing hands, and invisible
    /// or zero-area helper windows - a loading screen hands activation around, and none
    /// of those cases mean the user switched to another app.
    pub fn foreground_pid() -> Option<u32> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null() || !IsWindowVisible(hwnd).as_bool() {
                return None;
            }

            let mut rect = RECT::default();
            if GetWindowRect(hwnd, &mut rect).is_err()
                || rect.right <= rect.left
                || rect.bottom <= rect.top
            {
                return None;
            }

            let mut pid: u32 = 0;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));
            if pid == 0 {
                None
            } else {
                Some(pid)
            }
        }
    }

    /// Make the overlay visible and topmost without ever touching activation.
    ///
    /// Tauri's `set_always_on_top` goes through `SetWindowPos` without `SWP_NOACTIVATE`,
    /// which is enough to pull the foreground away from the game - and then our own
    /// foreground check hides the overlay we just showed.
    pub fn raise_without_activating(hwnd_raw: isize) {
        let hwnd = HWND(hwnd_raw as *mut c_void);
        unsafe {
            let _ = SetWindowPos(
                hwnd,
                Some(HWND_TOPMOST),
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_SHOWWINDOW,
            );
        }
    }

    pub fn is_minimised(hwnd_raw: isize) -> bool {
        let hwnd = HWND(hwnd_raw as *mut c_void);
        unsafe { IsIconic(hwnd).as_bool() }
    }

    pub fn get_dpi(hwnd_raw: isize) -> u32 {
        let hwnd = HWND(hwnd_raw as *mut c_void);
        let dpi = unsafe { GetDpiForWindow(hwnd) };
        if dpi == 0 {
            96
        } else {
            dpi
        }
    }

    /// Make the overlay HWND itself ignore mouse input and refuse activation.
    ///
    /// This is the part CSS `pointer-events: none` cannot do: without
    /// `WS_EX_TRANSPARENT` the WebView2 HWND still swallows every click, and without
    /// `WS_EX_NOACTIVATE` showing the window can pull focus off the game.
    pub fn apply_overlay_styles(hwnd_raw: isize) {
        let hwnd = HWND(hwnd_raw as *mut c_void);
        unsafe {
            let current = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
            let wanted = current
                | (WS_EX_TRANSPARENT.0 as isize)
                | (WS_EX_NOACTIVATE.0 as isize)
                | (WS_EX_TOOLWINDOW.0 as isize);
            if current != wanted {
                SetWindowLongPtrW(hwnd, GWL_EXSTYLE, wanted);
                debug!(
                    "Game overlay ex-style 0x{:x} -> 0x{:x}",
                    current as u32, wanted as u32
                );
            }
        }
    }
}

#[cfg(not(target_os = "windows"))]
mod imp {
    use super::Bounds;

    pub fn find_window_for_pid(_pid: u32) -> Option<isize> {
        None
    }
    pub fn get_window_bounds(_hwnd: isize) -> Option<Bounds> {
        None
    }
    pub fn foreground_pid() -> Option<u32> {
        None
    }
    pub fn raise_without_activating(_hwnd: isize) {}
    pub fn is_minimised(_hwnd: isize) -> bool {
        false
    }
    pub fn get_dpi(_hwnd: isize) -> u32 {
        96
    }
    pub fn apply_overlay_styles(_hwnd: isize) {}
}

pub use imp::{
    apply_overlay_styles, find_window_for_pid, foreground_pid, get_dpi, get_window_bounds,
    is_minimised, raise_without_activating,
};

/// The game's main window, if the game is running and has one.
pub fn find_game_window() -> Option<isize> {
    #[cfg(target_os = "windows")]
    {
        crate::process_watcher::find_game_process_id().and_then(find_window_for_pid)
    }
    #[cfg(not(target_os = "windows"))]
    {
        None
    }
}
