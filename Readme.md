# COH3 Stats Desktop App

View stats of players in the current game of Company of Heroes 3.

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
6. In the browser properties select local file
<br/><a href="url"><img src="https://user-images.githubusercontent.com/25324640/227333676-94a10104-23f8-41ff-8b60-26b34eac698c.png" height="400" ></a>
7. In the Coh3 Stats Desktop App go into settings
<br/><a href="url"><img src="https://user-images.githubusercontent.com/25324640/227334078-e975b12a-6730-4afd-9be1-3ed160371661.png" height="400" ></a>
8. Copy the path to the streamerOverlay.html
<br/><a href="url"><img src="https://user-images.githubusercontent.com/25324640/227336591-6eba8879-ddd7-4f38-ab22-31573e4df8df.png" height="400" ></a>
9. In the OBS properties window click on browse to set the path to the streamerOverlay.html
<br/><a href="url"><img src="https://user-images.githubusercontent.com/25324640/227336733-aee8ac78-e076-4077-a756-e463752fae0c.png" height="400" ></a>
10. An explorer window opens. Paste the copied path into the path field and hit enter
<br/><a href="url"><img src="https://user-images.githubusercontent.com/25324640/227337198-3058a4cc-94b8-45e1-b059-9edd1ca98b6a.png" height="400" ></a>
11. Select the streamerOverlay.html file and click open
<br/><a href="url"><img src="https://user-images.githubusercontent.com/25324640/227337374-e2ded687-1cdb-442d-b384-0f9c5fd8cb43.png" height="400" ></a>
12. Set the resolution to the same resolution Coh3 is running at. E.G 1920 Width and 1080 Height
<br/><a href="url"><img src="https://user-images.githubusercontent.com/25324640/227337508-78e625e2-e72b-42d7-87fd-811a02c7e5e4.png" height="400" ></a>
13. Click Ok to finish creating the source
<br/><a href="url"><img src="https://user-images.githubusercontent.com/25324640/227337725-c9f9d443-1611-4765-94a6-5411c2032c86.png" height="400" ></a>
14. Scale the source to match the Coh3 source size

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
  text-align: center;
}

.coh3stats-overlay-player-rating {
  padding-right: 10px;
  min-width: 4ch;
  display: inline-block;
  text-align: center;
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
![image](https://github.com/cohstats/coh3-stats-desktop-app/assets/8086995/fa62f8df-0c08-4a1f-a12b-ca1598b2deb6)
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

To build the app and an installer run:

```
yarn tauri build
```

The build output can be found in `src-tauri/target/release`. The installer can be found in `src-tauri/target/release/bundle/msi`.

Don't forget to run prettier with `yarn fix`. 

### Release
- Increase the version in files:
  - `package.json`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.toml`
- Commit the updated version 
- Make a new tag on master
- Merge master into release branch (TODO: Why we have separate release branch?)



## Project Architecture

### Frontend

The frontend is run on the OS native web renderer. This frontend is build with Vite + React + Typescript. The frontend related files are at the root level of the project with the React components in the `src` folder.

### Backend

The backend wrapping the frontend code is created with Rust + Tauri. The code can be found in the src-tauri folder.

### App configuration file

The main configuration file of the app is in `src-tauri/tauri.conf.json`.
