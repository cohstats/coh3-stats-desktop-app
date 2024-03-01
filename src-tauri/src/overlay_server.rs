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
            return;
        }
    };

    for request in server.incoming_requests() {
        let file = match File::open(&streamer_overlay_path) {
            Ok(file) => file,
            Err(_) => {
                let response = Response::new_empty(StatusCode(404));
                let _ = request.respond(response);
                continue;
            }
        };

        let response = Response::from_file(file);
        let _ = request.respond(response);
    }
}
