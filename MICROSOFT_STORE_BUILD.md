# Microsoft Store Build Guide

This document explains how to build the COH3 Stats Desktop App for the Microsoft Store.

## Overview

The Microsoft Store version of the app has a special configuration that disables the built-in auto-updater, since the Microsoft Store handles app updates through its own update mechanism.

## Key Differences from Regular Build

### 1. Auto-Updater Disabled

The Microsoft Store build disables the auto-updater in two ways:

- **Configuration Level**: The `tauri.microsoftstore.conf.json` file has the updater plugin removed and `createUpdaterArtifacts` set to `false`
- **Runtime Level**: The `VITE_DISABLE_UPDATER` environment variable is set to `true`, which prevents the UpdaterProvider from checking for updates

### 2. WebView2 Installation Mode

The Microsoft Store build uses `offlineInstaller` mode for WebView2, while the regular build uses `embedBootstrapper`.

## Building for Microsoft Store

### Quick Method (Recommended)

Use the dedicated npm script:

```bash
yarn tauri:build:msstore
```

This script automatically:

- Loads all environment variables from `.env` file (including `TAURI_KEY_PASSWORD` and `TAURI_PRIVATE_KEY` for signing)
- Sets `VITE_DISABLE_UPDATER=true` to disable the updater
- Uses the Microsoft Store configuration file
- Builds the app without updater functionality

### Manual Method

If you need to build manually without the script, you need to:

1. Load environment variables from `.env` file
2. Set `VITE_DISABLE_UPDATER=true`
3. Use the Microsoft Store configuration

**On Windows (PowerShell):**

```powershell
# Load .env file and set VITE_DISABLE_UPDATER
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}
$env:VITE_DISABLE_UPDATER="true"
yarn tauri build --config src-tauri/tauri.microsoftstore.conf.json
```

**On Linux/macOS:**

```bash
# Load .env file and set VITE_DISABLE_UPDATER
export $(cat .env | grep -v '^#' | xargs)
export VITE_DISABLE_UPDATER=true
yarn tauri build --config src-tauri/tauri.microsoftstore.conf.json
```

**Note:** The recommended approach is to use `yarn tauri:build:msstore` which handles all of this automatically.

## Configuration Files

### src-tauri/tauri.microsoftstore.conf.json

This is the Tauri configuration file specifically for Microsoft Store builds. Key differences:

```json
{
  "bundle": {
    "createUpdaterArtifacts": false, // Don't create update files
    "windows": {
      "webviewInstallMode": {
        "type": "offlineInstaller" // Include WebView2 installer
      }
    }
  },
  "plugins": {} // Updater plugin removed
}
```

### .env

The `.env` file contains documentation about the `VITE_DISABLE_UPDATER` variable:

```env
# Updater Configuration
# Set to 'false' to disable the auto-updater (e.g., for Microsoft Store builds)
# Set to 'true' or leave unset for normal builds with auto-update enabled
# VITE_DISABLE_UPDATER=false
```

## How It Works

### 1. Environment Variable Loading

The build script uses `dotenv-cli` to load environment variables from `.env`:

- `TAURI_KEY_PASSWORD` - Password for the signing key
- `TAURI_PRIVATE_KEY` - Private key for signing the build
- Any other environment variables defined in `.env`

Then it sets `VITE_DISABLE_UPDATER=true` using `cross-env` to ensure cross-platform compatibility.

### 2. Build-Time Configuration

When building with the Microsoft Store config:

- Tauri doesn't include the updater plugin
- No updater artifacts (`.sig` files) are generated
- The app binary doesn't include updater code

### 3. Runtime Behavior

The `UpdaterProvider` component checks the environment variable:

```typescript
const isUpdaterDisabled = import.meta.env.VITE_DISABLE_UPDATER === "true";

if (isUpdaterDisabled) {
  info("[Updater] Auto-updater is disabled via VITE_DISABLE_UPDATER environment variable");
  return;
}
```

When disabled:

- No update checks are performed on app startup
- The `checkForUpdates()` function returns early
- No network requests are made to the update endpoint
- Users won't see update notifications

## Testing the Build

After building for Microsoft Store, verify that:

1. The app launches successfully
2. No update checks appear in the logs
3. The app doesn't attempt to connect to the update endpoint
4. All other functionality works normally

You can check the logs to confirm the updater is disabled:

```
[Updater] Auto-updater is disabled via VITE_DISABLE_UPDATER environment variable
```

## Troubleshooting

### Updater Still Running

If the updater is still checking for updates:

1. Verify the environment variable is set correctly
2. Check that you're using the correct config file
3. Rebuild the app completely: `yarn reinstall && yarn tauri:build:msstore`

### Build Errors

If you encounter build errors:

1. Make sure all dependencies are installed: `yarn install`
   - Required packages: `cross-env` and `dotenv-cli`
2. Verify the `.env` file exists and contains `TAURI_KEY_PASSWORD` and `TAURI_PRIVATE_KEY`
3. Verify the config file exists: `src-tauri/tauri.microsoftstore.conf.json`
4. Check that all dependencies are up to date

## Regular Build vs Microsoft Store Build

| Feature          | Regular Build      | Microsoft Store Build            |
| ---------------- | ------------------ | -------------------------------- |
| Auto-updater     | ✅ Enabled         | ❌ Disabled                      |
| Update artifacts | ✅ Generated       | ❌ Not generated                 |
| WebView2 mode    | embedBootstrapper  | offlineInstaller                 |
| Config file      | `tauri.conf.json`  | `tauri.microsoftstore.conf.json` |
| Build command    | `yarn tauri build` | `yarn tauri:build:msstore`       |

## Deployment

After building:

1. The MSI installer will be in `src-tauri/target/release/bundle/msi/`
2. Upload this MSI to the Microsoft Store Partner Center
3. The Microsoft Store will handle all future updates

## Notes

- Always use the Microsoft Store build when submitting to the Microsoft Store
- Never use the regular build for Microsoft Store submissions (it will conflict with Store updates)
- The updater configuration is separate from the app version number
- Users on the Microsoft Store will receive updates through the Store, not through the app's built-in updater
