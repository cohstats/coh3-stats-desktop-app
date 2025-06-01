# COH3 Stats Desktop App

View stats of players in the current game of Company of Heroes 3.  
**Download from https://coh3stats.com/desktop-app** or from [release page](https://github.com/cohstats/coh3-stats-desktop-app/releases).

#### WebView Bundle

This application needs WebView2 Runtime. This is by default part of Windows 10 and 11.
If you are missing the runtime, the installer will be automatically triggered.
But if for any reason you don't want to install the WebView into your system, you can donwload
the release called "fullBundle" which has all deps included.    
**Download Full Bundle from [releases](https://github.com/cohstats/coh3-stats-desktop-app/releases/)**

## Setup OBS Streamer Overlay

1. Make sure you have used the Coh3 Stats Desktop App once and it displayed stats of players in your game
   <a href="url"><img src="https://user-images.githubusercontent.com/25324640/227332549-4883c113-0d35-4ba3-8136-9684094abbe2.png" height="400" ></a>
2. Start OBS
3. In OBS Sources section click on "Add Source"
   <a href="url"><img src="https://user-images.githubusercontent.com/25324640/227333163-684f30c8-a5cd-4aea-b65b-c297b39ff65f.png" height="400" ></a>
4. Select Browser<br/>
   <a href="url"><img src="https://user-images.githubusercontent.com/25324640/227333226-2b0315c0-0e2c-4972-bb10-ffc1d98bc25c.png" height="400" ></a>
5. Create a new Browser Source with any name you want
   <br/><a href="url"><img src="https://user-images.githubusercontent.com/25324640/227333417-64f4cca3-0bd0-48aa-9de7-2e72d1dfc168.png" height="400" ></a>
6. Open the App, Go to Settings, Copy the path to localhost server http://localhost:47824
   <br/><a href="url"><img src="https://github.com/user-attachments/assets/6c683a12-3bfe-436e-aab3-2e503dab4302" height="400" ></a>
7. In the browser properties add URL from the app
   <br/><a href="url"><img src="https://github.com/user-attachments/assets/555acf06-d597-4e03-bc8f-3ac2b88c8236" height="400" ></a>
8. Set the resolution to the resolution of the stream
   <br/><a href="url"><img src="https://github.com/user-attachments/assets/dfd7ec05-c113-4687-80cf-82768ea7fd12" height="400" ></a>
9. Click OK and you are set! You can optionally setup a custom CSS to change the visual style / or move it.

## Custom CSS for the overlay

If you don't like the default style of overlay, you can modify it with custom CSS.
All the elements in the overlay have CSS classes assigned. The styling is as follows:

```
.coh3stats-overlay {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: stretch;
  position: absolute;
  left: calc((100vw / 2) - 485px);
  right: calc((100vw / 2) - 485px);
  top: 65px;
}

.coh3stats-overlay-left {
  flex-grow: 1;
  flex-basis: 0;
  padding-right: 40px;
  padding-left: 10px;
}

.coh3stats-overlay-right {
  flex-grow: 1;
  flex-basis: 0;
  padding-left: 40px;
  padding-right: 10px;
}

.coh3stats-overlay-player {
  color: white;
  font-size: 20px;
  font-family: Tilt Warp;
}

.coh3stats-overlay-player-factionIcon {
  padding-right: 10px;
  width: 25px;
  height: 25px;
}

.coh3stats-overlay-player-flagIcon {
  padding-right: 10px;
  width: 25px;
  height: 25px;
}

.coh3stats-overlay-player-rank {
  padding-right: 10px;
  min-width: 4ch;
  display: inline-block;
  overflow: auto;
}

.coh3stats-overlay-player-rating {
  padding-right: 10px;
  min-width: 4ch;
  display: inline-block;
  overflow: auto;
}

.coh3stats-overlay-player-name {
  max-width: 17ch;
  display: inline-block;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
```

Steps when you want to change something.
Let's say I want to move it lower and change the color to red.

1. Pick the classes you want to change and do the changes:

```
.coh3stats-overlay {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: stretch;
  position: absolute;
  left: calc((100vw / 2) - 485px);
  right: calc((100vw / 2) - 485px);
  top: 250px;
}

.coh3stats-overlay-player {
  color: red;
  font-size: 20px;
  font-family: Tilt Warp;
}
```

2. Open the configuration of "Overlay" in OBS
3. Paste the 2 modified classes into the box Custom CSS
   ![image](https://github.com/cohstats/coh3-stats-desktop-app/assets/8086995/c6f4cb56-f250-40f9-be93-5f65fefe8421)
4. Click OK and observe the changes
   ![image](https://github.com/cohstats/coh3-stats-desktop-app/assets/8086995/ee77f6f8-2a8b-4da5-960c-e2c15f119d48)

## Development

Install rust on your system using rustup https://www.rust-lang.org/tools/install

Install all dependencies with:

```
yarn install
```

To start the development build with hot reload run:

```
yarn tauri dev
```

The first execution takes a bit longer as the rust libraries have to be compiled once. Any future restarts will be much faster!

#### To build the app and an installer run:

```
yarn tauri build
```

The build output can be found in `src-tauri/target/release`. The installer can be found in `src-tauri/target/release/bundle/msi`. We distribute the app with msi installer, so
let's keep that consitent.

#### Running Rust BE Tests:

```
cargo test --package coh3-stats-desktop-app --lib
```

#### Running e2e tests:

Build the app and run

```
yarn test:e2e
```

https://tauri.app/v1/guides/testing/webdriver/introduction

- Install tauri driver `cargo install tauri-driver`
- Get msedgedriver.exe to your path https://tauri.app/v1/guides/testing/webdriver/introduction/#windows

Don't forget to run prettier with `yarn fix`. Should be covered by husky.

### Release

- Increase the version in files:
  - `package.json`
  - `src-tauri/Cargo.toml`
- Commit the updated version
- Make a new tag on master

## Project Architecture

### Frontend

The frontend is run on the OS native web renderer. This frontend is build with Vite + React + Typescript. The frontend related files are at the root level of the project with the React components in the `src` folder.

### Backend

The backend wrapping the frontend code is created with Rust + Tauri. The code can be found in the src-tauri folder.

### App configuration file

The main configuration file of the app is in `src-tauri/tauri.conf.json`.
