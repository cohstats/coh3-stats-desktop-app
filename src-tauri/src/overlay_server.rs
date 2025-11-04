use log::{error, info};
use std::fs::File;
use std::path::PathBuf;

use tiny_http::{Response, Server, StatusCode};

use crate::config::OVERLAY_PORT;

pub fn run_http_server(streamer_overlay_path: PathBuf) {
    // Ideally we would allow setting up port in the settings
    info!("Starting streamer overlay server on port {}", OVERLAY_PORT);

    let server = match Server::http(format!("127.0.0.1:{}", OVERLAY_PORT)) {
        Ok(server) => server,
        Err(err) => {
            error!("Couldn't start the streamer overlay server: {:?}", err);
            sentry::capture_message(
                &format!("Overlay server startup error on port {}: {}", OVERLAY_PORT, err),
                sentry::Level::Error,
            );
            return;
        }
    };

    info!("Streamer overlay server started successfully on port {}", OVERLAY_PORT);

    for request in server.incoming_requests() {
        let file = match File::open(&streamer_overlay_path) {
            Ok(file) => file,
            Err(err) => {
                error!("Failed to open overlay file at {:?}: {}", streamer_overlay_path, err);
                // Only report to Sentry on first few errors to avoid spam
                static mut ERROR_COUNT: u32 = 0;
                unsafe {
                    if ERROR_COUNT < 3 {
                        sentry::capture_message(
                            &format!("Overlay file access error: {:?} - {}", streamer_overlay_path, err),
                            sentry::Level::Warning,
                        );
                        ERROR_COUNT += 1;
                    }
                }
                let response = Response::new_empty(StatusCode(404));
                let _ = request.respond(response);
                continue;
            }
        };

        let response = Response::from_file(file);
        if let Err(err) = request.respond(response) {
            error!("Failed to send overlay response: {:?}", err);
        }
    }
}
