# Coh3 Stats Desktop App

View stats of players in the current game of Company of Heroes 3.

## Setup OBS Streamer Overlay

1. Make sure you have used the Coh3 Stats Desktop App once and it displayed stats of players in your game
![grafik](https://user-images.githubusercontent.com/25324640/227332549-4883c113-0d35-4ba3-8136-9684094abbe2.png)
2. Start OBS
3. In OBS Sources section click on "Add Source"
![grafik](https://user-images.githubusercontent.com/25324640/227333163-684f30c8-a5cd-4aea-b65b-c297b39ff65f.png)
4. Select Browser
![grafik](https://user-images.githubusercontent.com/25324640/227333226-2b0315c0-0e2c-4972-bb10-ffc1d98bc25c.png)
5. Create a new Browser Source with any name you want
![grafik](https://user-images.githubusercontent.com/25324640/227333417-64f4cca3-0bd0-48aa-9de7-2e72d1dfc168.png)
6. In the browser properties select local file
![grafik](https://user-images.githubusercontent.com/25324640/227333676-94a10104-23f8-41ff-8b60-26b34eac698c.png)
7. In the Coh3 Stats Desktop App go into settings
![grafik](https://user-images.githubusercontent.com/25324640/227334078-e975b12a-6730-4afd-9be1-3ed160371661.png)
8. Copy the path to the streamerOverlay.html

9. In the OBS properties window click on browse to set the path to the streamerOverlay.html

10. An explorer window opens. Paste the copied path into the path field

11. Select the streamerOverlay.html file and click open

12. Set the resolution to the same resolution Coh3 is running at. E.G 1920 Width and 1080 Height

13. Click Ok to finish creating the source

14. Scale the source to match the Coh3 source size

## Development

Install rust on your system using rustup https://www.rust-lang.org/tools/install

Install all dependecies with:

```
yarn install
```

To start the development build with hot reload run:

```
yarn tauri dev
```

The first execution takes a bit longer as the rust libraries have to be compiled once. Any future restarts will be much faster!

To build the app and an installer run:

```
yarn tauri build
```

The build output can be found in `src-tauri/target/release`. The installer can be found in `src-tauri/target/release/bundle/msi`.

## Project Architecture

### Frontend

The frontend is run on the OS native web renderer. This frontend is build with Vite + React + Typescript. The frontend related files are at the root level of the project with the React components in the `src` folder.

### Backend

The backend wrapping the frontend code is created with Rust + Tauri. The code can be found in the src-tauri folder.

### App configuration file

The main configuration file of the app is in `src-tauri/tauri.conf.json`.
