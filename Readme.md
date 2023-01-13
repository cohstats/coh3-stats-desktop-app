# Coh2 Game Stats Lightweight

This is a lightweight alternative desktop application to show ranks of players in the current game of coh2. It does not have all features the full application provides but uses less hardware resources and has a more user friendly installer.

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
