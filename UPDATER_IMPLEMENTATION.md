# Auto-Updater Implementation - Tauri v2

## Overview

This document describes the auto-updater implementation for the COH3 Stats Desktop App after migration from Tauri v1 to Tauri v2.

## What Was Broken

The auto-updater was completely non-functional after the Tauri v2 migration due to several critical issues:

1. **Missing Frontend Package**: The `@tauri-apps/plugin-updater` JavaScript package was not installed
2. **Missing Plugin Initialization**: The updater plugin was in `Cargo.toml` but never initialized in the Rust backend
3. **No Update Check Logic**: There was no code to actually check for updates or trigger the update process
4. **Configuration Format**: The configuration was present but needed verification for Tauri v2 compatibility

## What Was Fixed

### 1. Frontend Package Installation

**File**: `package.json`

Added the missing updater plugin package:

```json
"@tauri-apps/plugin-updater": "2.4.0"
```

### 2. Rust Backend Plugin Initialization

**File**: `src-tauri/src/lib.rs`

Added plugin initialization in the `setup` function:

```rust
// Initialize updater plugin for desktop platforms
#[cfg(desktop)]
{
    info!("Initializing updater plugin");
    handle.plugin(tauri_plugin_updater::Builder::new().build())?;
}
```

### 3. Frontend Update Check Logic

**File**: `src/providers/UpdaterProvider.tsx` (NEW)

Created a comprehensive updater provider with:

- Automatic update checking on app startup
- User-friendly update modal with release notes
- Download progress tracking
- Comprehensive logging throughout the update flow
- Error handling with graceful fallbacks

**File**: `src/Providers.tsx`

Integrated the UpdaterProvider into the app's provider hierarchy.

### 4. Configuration Verification

**File**: `src-tauri/tauri.conf.json`

Verified the updater configuration is correct for Tauri v2:

```json
{
  "bundle": {
    "createUpdaterArtifacts": "v1Compatible"
  },
  "plugins": {
    "updater": {
      "pubkey": "...",
      "endpoints": ["https://coh3stats.com/api/appUpdateRouteV2"]
    }
  }
}
```

**File**: `src-tauri/capabilities/desktop-app-capabilities.json`

Confirmed the updater permissions are present:

```json
{
  "permissions": [
    "updater:default",
    ...
  ]
}
```

## Logging Implementation

The updater now includes comprehensive logging at every step:

### Rust Backend Logs

- Plugin initialization confirmation

### Frontend Logs

- Update check initiation with current version
- Update availability status
- Update metadata (version, date, release notes)
- Download progress (bytes and percentage)
- Installation status
- Relaunch confirmation
- All errors with full stack traces

Logs are written to:

- Console (for development)
- Tauri log files via `@tauri-apps/plugin-log` (for production debugging)

## How It Works

### Update Check Flow

1. **App Startup**: When the app starts, `UpdaterProvider` automatically checks for updates
2. **Server Request**: The updater queries the configured endpoint (`https://coh3stats.com/api/appUpdateRouteV2`)
3. **Version Comparison**: If a newer version is available, the update metadata is retrieved
4. **User Notification**: A notification and modal are shown to the user
5. **User Choice**: User can choose to install now or later

### Update Installation Flow

1. **Download**: The update bundle is downloaded with progress tracking
2. **Verification**: The signature is verified using the public key
3. **Installation**: The update is installed (on Windows, the app exits automatically)
4. **Relaunch**: The app restarts to complete the update

## Testing the Updater

### Prerequisites

1. **Signing Keys**: Ensure you have the private key set in environment variables:

   ```bash
   # Mac/Linux
   export TAURI_SIGNING_PRIVATE_KEY="Path or content of your private key"
   export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""  # if you have a password

   # Windows (PowerShell)
   $env:TAURI_SIGNING_PRIVATE_KEY="Path or content of your private key"
   $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""  # if you have a password
   ```

2. **Build the App**: Build the app with updater artifacts:
   ```bash
   yarn tauri build
   ```

### Testing Update Availability

To test if the updater correctly detects available updates:

1. **Check Logs**: Look for updater logs in the console or log files:
   - `[Updater] Starting update check. Current version: X.X.X`
   - `[Updater] Checking update endpoint configured in tauri.conf.json`
   - `[Updater] Update available!` or `[Updater] No update available`

2. **Verify Server Response**: The update server should return:
   - `204 No Content` if no update is available
   - `200 OK` with JSON if an update is available

3. **Test Update Modal**: If an update is available, verify:
   - Modal appears with correct version information
   - Release notes are displayed
   - "Install Now" and "Install Later" buttons work

### Testing Update Installation

To test the full update installation:

1. **Trigger Update**: Click "Install Now" in the update modal
2. **Monitor Progress**: Watch the progress bar and logs:
   - `[Updater] Download started. Content length: X bytes`
   - `[Updater] Download progress: X/Y bytes (Z%)`
   - `[Updater] Download finished`
   - `[Updater] Update installed successfully`
   - `[Updater] Relaunching application now`

3. **Verify Installation**: After relaunch, check:
   - App version is updated (in About page)
   - App functions correctly

### Simulating Updates for Testing

To test the updater without publishing a real update:

1. **Local Test Server**: Set up a local server that returns update JSON
2. **Modify Endpoint**: Temporarily change the endpoint in `tauri.conf.json` to your test server
3. **Test Response**: Return a JSON response with a higher version number

Example test response:

```json
{
  "version": "9.9.9",
  "notes": "Test update",
  "pub_date": "2025-01-01T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "...",
      "url": "https://your-test-server.com/test-update.msi"
    }
  }
}
```

### Debugging Update Issues

If updates aren't working:

1. **Check Logs**: Review all `[Updater]` prefixed logs
2. **Verify Configuration**:
   - Public key is correct in `tauri.conf.json`
   - Endpoint URL is accessible
   - Permissions are set in capabilities file
3. **Test Endpoint**: Manually query the update endpoint to verify response
4. **Check Signature**: Ensure the update bundle is properly signed
5. **Network Issues**: Check for proxy/firewall blocking the update server

## Update Server Requirements

The update server at `https://coh3stats.com/api/appUpdateRouteV2` must:

1. **Return 204 No Content** when no update is available
2. **Return 200 OK with JSON** when an update is available:

   ```json
   {
     "version": "2.0.4",
     "notes": "Release notes here",
     "pub_date": "2025-01-15T12:00:00Z",
     "platforms": {
       "windows-x86_64": {
         "signature": "base64-encoded-signature",
         "url": "https://download-url.com/app-setup.msi"
       }
     }
   }
   ```

3. **Serve Update Bundles**: The URLs in the JSON must point to the actual update files
4. **Include Signatures**: Each platform must have a valid signature

## Migration Notes

### Differences from Tauri v1

1. **Plugin Architecture**: Updater is now a separate plugin instead of a built-in feature
2. **API Changes**:
   - Import from `@tauri-apps/plugin-updater` instead of `@tauri-apps/api/updater`
   - Plugin must be explicitly initialized in Rust
3. **Configuration**: Moved from `tauri.updater` to `plugins.updater` in config
4. **Permissions**: Must be explicitly granted in capabilities file

### Backward Compatibility

The configuration uses `"createUpdaterArtifacts": "v1Compatible"` to maintain compatibility with existing update infrastructure. This can be changed to `true` once all users are migrated to v2.

## Future Improvements

Potential enhancements to consider:

1. **Manual Update Check**: Add a button in Settings to manually check for updates
2. **Update Channels**: Support beta/stable channels
3. **Background Updates**: Download updates in the background without user interaction
4. **Update History**: Show a list of previous updates
5. **Rollback**: Allow users to rollback to previous versions if needed

## Troubleshooting

### Common Issues

**Issue**: Update check fails silently

- **Solution**: Check logs for error details, verify endpoint is accessible

**Issue**: Download fails

- **Solution**: Check network connectivity, verify signature is valid

**Issue**: App doesn't restart after update

- **Solution**: Check if `relaunch()` is being called, verify process permissions

**Issue**: Update modal doesn't appear

- **Solution**: Verify UpdaterProvider is in the component tree, check for JavaScript errors

## References

- [Tauri v2 Updater Plugin Documentation](https://v2.tauri.app/plugin/updater/)
- [Tauri v2 Migration Guide](https://v2.tauri.app/start/migrate/from-tauri-1/)
- [Signing Updates](https://v2.tauri.app/plugin/updater/#signing-updates)
