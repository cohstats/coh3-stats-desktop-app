import { configValueFactory } from "../config-store/configValueFactory";
import { invoke } from "@tauri-apps/api/core";

const [getLogFilePath, useLogFilePath] = configValueFactory<string | undefined>(
  "logFilePath",
  async () => (await invoke("default_log_file_path")) as string,
  async (value, store, defaultValue) => {
    const logFileExists = (await invoke("check_path_exists", {
      path: value,
    })) as boolean;

    if (logFileExists) {
      return value;
    }

    const defaultLogFileExists = (await invoke("check_path_exists", {
      path: defaultValue,
    })) as boolean;

    if (defaultLogFileExists) {
      return defaultValue;
    }

    return undefined;
  },
);

const [getPlaybackPath, usePlaybackPath] = configValueFactory<string | undefined>(
  "playbackPath",
  async () => (await invoke("default_playback_path")) as string,
  async (value, store, defaultValue) => {
    const logFileExists = (await invoke("check_path_exists", {
      path: value,
    })) as boolean;
    if (logFileExists) {
      return value;
    }
    const defaultPlaybackExists = (await invoke("check_path_exists", {
      path: defaultValue,
    })) as boolean;
    if (defaultPlaybackExists) {
      return defaultValue;
    }

    return undefined;
  },
);

const [getAutoSyncReplays, useAutoSyncReplays] = configValueFactory<boolean>(
  "autoSyncReplays",
  async () => true,
);

const [getMapViewSettings, useMapViewSettings] = configValueFactory<string>(
  "mapViewSettings",
  async () => "default",
);

const [getShowExtendedPlayerInfo, useShowExtendedPlayerInfo] = configValueFactory<boolean>(
  "showExtendedPlayerInfo",
  async () => false,
);

const [getPlayerProfileID, usePlayerProfileID] = configValueFactory<string | null>(
  "playerProfileID",
  async () => null,
);

export {
  getPlaybackPath,
  usePlaybackPath,
  getLogFilePath,
  useLogFilePath,
  useAutoSyncReplays,
  useMapViewSettings,
  useShowExtendedPlayerInfo,
  usePlayerProfileID,
};
