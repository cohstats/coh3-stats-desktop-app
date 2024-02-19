use std::fs::File;
use std::path::Path;
use std::panic;
use log::{error, info, warn};

use tiny_http::{Server, Response, StatusCode};

// const server: tiny_http::Server  = Server::http("127.0.0.1:8000").unwrap();
//
// const request: tiny_http::Request = match server.recv() {
//         Ok(rq) => rq,
//         Err(e) => { println!("error: {}", e); break }
//     };
//
// const response: tiny_http::Response = tiny_http::Response::from_file(File::open(&Path::new("image.png")).unwrap());
// const responded = request.respond(response);
//
//


pub fn test_fn() {

    let result = panic::catch_unwind(|| {

        println!("Starting server...");
       let server = Server::http("127.0.0.1:8000").unwrap();

       for request in server.incoming_requests() {
           let file_path = Path::new(r"C:\Users\pagep\AppData\Roaming\com.coh3stats.desktop\streamerOverlay.html");
           let file = match File::open(&file_path) {
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
            println!("Error: {:?}", err);
            error!("Couldn't start the : {:?}", err);
      }

}
