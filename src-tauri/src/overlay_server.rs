use std::fs::File;
use std::path::Path;
use std::panic;
use log::{error, info, warn};
use std::path::PathBuf;

use tiny_http::{Server, Response, StatusCode};

pub fn run_http_server(streamer_overlay_path: PathBuf) {

    let result = panic::catch_unwind(|| {

       info!("Starting streamer overlay server on port 8000");
       let server = Server::http("127.0.0.1:8000").unwrap();

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

    });

     if let Err(err) = result {
            error!("Couldn't start the streamer overlay server: {:?}", err);
      }

}
