import {
  Box,
  Group,
  Stack,
  Divider,
  Input,
  ActionIcon,
  Text,
  Button,
  Tooltip,
  Checkbox,
  Slider,
  Anchor,
  Switch,
  Spoiler,
  Select,
} from "@mantine/core";
import { appDataDir } from "@tauri-apps/api/path";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import React, { useEffect, useState } from "react";
import { IconCheck, IconCopy, IconInfoCircle, IconPlayerPlay, IconX } from "@tabler/icons-react";
import { open } from "@tauri-apps/plugin-dialog";
import { open as openLink } from "@tauri-apps/plugin-shell";
import {
  useLogFilePath,
  useMapViewSettings,
  useShowExtendedPlayerInfo,
} from "../game-data-provider/configValues";
import { usePlaySound, usePlaySoundVolume } from "../game-found-sound/configValues";
import { useAutoSwitchToGame } from "../game-found-sound/autoSwitchConfigValues";
import {
  useShowFlagsOverlay,
  useAlwaysShowOverlay,
  useStreamerOverlayEnabled,
} from "../streamer-overlay/configValues";
import { playSound as playSoundFunc } from "../game-found-sound/playSound";
import events from "../mixpanel/mixpanel";
import { useGameData } from "../game-data-provider/GameDataProvider";
import { relaunch } from "@tauri-apps/plugin-process";
import { getMapsUrlOnCDN } from "../utils/utils";
import { MapViewSettings } from "../game-data-provider/GameData-types";
import { ColorSchemeToggle } from "../components/ToggleCollorShemeButton";

export const Settings: React.FC = () => {
  const gameData = useGameData();
  const [logFilePath, setLogFilePath] = useLogFilePath();
  const [playSound, setPlaySound] = usePlaySound();
  const [playSoundVolume, setPlaySoundVolume] = usePlaySoundVolume();
  const [autoSwitchToGame, setAutoSwitchToGame] = useAutoSwitchToGame();
  const [showFlagsOverlay, setShowFlagsOverlay] = useShowFlagsOverlay();
  const [alwaysShowOverlay, setAlwaysShowOverlay] = useAlwaysShowOverlay();
  const [mapViewSettings, setMapViewSettings] = useMapViewSettings();
  const [showExtendedPlayerInfo, setShowExtendedPlayerInfo] = useShowExtendedPlayerInfo();

  const [streamerOverlayEnabled, setStreamerOverlayEnabled] = useStreamerOverlayEnabled();
  const [appDataPath, setAppDataPath] = useState<string>("");
  const [restartRequired, setRestartRequired] = useState<boolean>(false);

  useEffect(() => {
    events.open_settings();
  }, []);

  useEffect(() => {
    const getAppDataPath = async () => {
      const path = await appDataDir();
      setAppDataPath(path);
    };
    if (appDataPath === "") {
      getAppDataPath();
    }
  }, [appDataPath]);

  const openLogfileDialog = async () => {
    const selected = await open({
      title: "Select Coh3 warnings.log file",
      multiple: false,
      directory: false,
      defaultPath: logFilePath,
      filters: [
        {
          name: "Logfile",
          extensions: ["log"],
        },
      ],
    });
    if (selected !== null) {
      events.settings_changed("logFilePath", selected as string);
      setLogFilePath(selected as string);
    }
  };

  return (
    <>
      <Box p="xl" pt={"md"}>
        <Stack>
          <Tooltip
            multiline
            w={600}
            label={
              "If the app is stuck loading, you most likely have the wrong path. This often happens when you have OneDrive, Dropbox, or similar services installed. Please locate the correct warnings.log file. The default path is: C:\\Users\\Username\\Documents\\My Games\\Company of Heroes 3\\warnings.log"
            }
          >
            <div>
              Correct path to warnings.log file from CoH3 is required for the app to work.{" "}
              <IconInfoCircle size={20} style={{ marginBottom: -4 }} />
            </div>
          </Tooltip>
          <Group>
            <div>Path to warnings.log:</div>
            <div>
              <Group gap="xs">
                <Group gap={3}>
                  <Input value={logFilePath ? logFilePath : ""} style={{ width: 500 }} readOnly />
                  <Button variant="default" onClick={openLogfileDialog}>
                    Select
                  </Button>
                </Group>
                <Tooltip
                  label={logFilePath !== undefined ? "Log file found" : "Could not find log file"}
                >
                  <ActionIcon
                    variant="light"
                    color={logFilePath !== undefined ? "green" : "red"}
                    radius="xl"
                  >
                    {logFilePath !== undefined ? (
                      <IconCheck size="1.125rem" />
                    ) : (
                      <IconX size="1.125rem" />
                    )}
                  </ActionIcon>
                </Tooltip>
              </Group>
            </div>
          </Group>
          <Divider />
          <Group>
            <div>Color Theme:</div>
            <div data-testid="color-scheme-toggle">
              <ColorSchemeToggle />
            </div>
          </Group>

          <Group>
            <div>Play sound on match found:</div>
            <div>
              <Group>
                <Checkbox
                  checked={playSound === undefined ? false : playSound}
                  onChange={(event) => {
                    events.settings_changed("play_sound", `${event.currentTarget.checked}`);
                    setPlaySound(event.currentTarget.checked);
                  }}
                />
                <Text>Volume:</Text>
                <Slider
                  min={0.1}
                  max={1}
                  step={0.1}
                  style={{ width: "100px" }}
                  label={playSoundVolume ? <>{playSoundVolume.toFixed(1)}</> : null}
                  value={playSoundVolume}
                  onChange={setPlaySoundVolume}
                  onChangeEnd={(value) => {
                    events.settings_changed("play_sound_volume", value);
                  }}
                />
                <Tooltip label="Play sound">
                  <ActionIcon radius="xl" variant="filled" color="blue" onClick={playSoundFunc}>
                    <IconPlayerPlay size="1.125rem" />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </div>
          </Group>
          <Group>
            <div>Auto-switch to game view when match found:</div>
            <div>
              <Checkbox
                checked={autoSwitchToGame === undefined ? true : autoSwitchToGame}
                onChange={(event) => {
                  events.settings_changed(
                    "auto_switch_to_game",
                    `${event.currentTarget.checked}`,
                  );
                  setAutoSwitchToGame(event.currentTarget.checked);
                }}
              />
            </div>
          </Group>
          <Group>
            <Tooltip
              multiline
              w={600}
              label="Shows best rank and mode for a given faction. Total WinRate for the given faction across all modes. And overall winrate in all games."
            >
              <div>
                Show extended player info:{" "}
                <IconInfoCircle size={20} style={{ marginBottom: -4 }} />{" "}
              </div>
            </Tooltip>

            <div>
              <Group>
                <Checkbox
                  checked={showExtendedPlayerInfo === undefined ? false : showExtendedPlayerInfo}
                  onChange={(event) => {
                    events.settings_changed(
                      "show_extended_player_info",
                      `${event.currentTarget.checked}`,
                    );
                    setShowExtendedPlayerInfo(event.currentTarget.checked);
                  }}
                />
                <img
                  src={`example-extended-player-${showExtendedPlayerInfo ? "" : "no"}info.webp`}
                  alt="MapExample"
                  // width={250}
                  height={70}
                  style={{
                    // objectFit: "cover",
                    borderRadius: 7,
                  }}
                />
              </Group>
            </div>
          </Group>
          <Group>
            <Select
              label={<Text>Select map view markings</Text>}
              allowDeselect={false}
              withCheckIcon={false}
              value={mapViewSettings}
              data={[
                { value: "default", label: "Default" },
                { value: "tm", label: "TM" },
                { value: "colored", label: "Colored" },
                { value: "none", label: "None" },
              ]}
              onChange={(value) => {
                events.settings_changed("mapViewSettings", `${value}`);
                setMapViewSettings(value as "string");
              }}
            />
            <img
              src={
                getMapsUrlOnCDN("catania_crossing_6p", mapViewSettings as MapViewSettings) || ""
              }
              alt="MapExample"
              width={250}
              height={80}
              style={{
                objectFit: "cover",
                borderRadius: 7,
              }}
            />
          </Group>
          <Divider />
          <Group>
            <Text fw={700}>OBS Streamer Overlay</Text>
            <Switch
              onLabel="ON"
              offLabel="OFF"
              size="md"
              checked={streamerOverlayEnabled === undefined ? false : streamerOverlayEnabled}
              onChange={(event) => {
                events.settings_changed(
                  "streamerOverlayEnabled",
                  `${event.currentTarget.checked}`,
                );
                setStreamerOverlayEnabled(event.currentTarget.checked);
                setRestartRequired(true);
              }}
            />
          </Group>
          <Group>
            <div>
              {restartRequired ? (
                <Group>
                  <Text c="red">Restart required to enable / disable streamer overlay</Text>
                  <Button
                    variant="outline"
                    color="red"
                    size="compact-md"
                    onClick={async () => {
                      // Relaunch doesn't work well in dev mode
                      await relaunch();
                    }}
                  >
                    Restart
                  </Button>
                </Group>
              ) : null}
            </div>
          </Group>
          <Group>
            <div>
              <Checkbox
                labelPosition="left"
                label="Only show stats when loading / ingame:"
                disabled={streamerOverlayEnabled === undefined ? false : !streamerOverlayEnabled}
                checked={alwaysShowOverlay === undefined ? true : !alwaysShowOverlay}
                onChange={(event) => {
                  events.settings_changed("alwaysShowOverlay", `${!event.currentTarget.checked}`);
                  setAlwaysShowOverlay(!event.currentTarget.checked);
                  if (gameData) {
                    gameData.reloadLogFile();
                  }
                }}
              />
            </div>
          </Group>
          <Group>
            <div>
              <Checkbox
                labelPosition="left"
                label="Show flags"
                disabled={streamerOverlayEnabled === undefined ? false : !streamerOverlayEnabled}
                checked={showFlagsOverlay === undefined ? false : showFlagsOverlay}
                onChange={(event) => {
                  events.settings_changed("showFlagsOverlay", `${event.currentTarget.checked}`);
                  setShowFlagsOverlay(event.currentTarget.checked);
                  if (gameData) {
                    gameData.reloadLogFile();
                  }
                }}
              />
            </div>
          </Group>
          <div>
            <Text fw={700}>
              Follow the{" "}
              <Anchor
                inherit
                onClick={() =>
                  openLink(
                    "https://github.com/cohstats/coh3-stats-desktop-app#setup-obs-streamer-overlay",
                  )
                }
              >
                Setup instructions
              </Anchor>{" "}
              &{" "}
              <Anchor
                onClick={() =>
                  openLink(
                    "https://github.com/cohstats/coh3-stats-desktop-app#custom-css-for-the-overlay",
                  )
                }
              >
                Custom CSS instructions
              </Anchor>
            </Text>
          </div>
          <Group>
            <Text>Streamer overlay avaliable at:</Text>
            <Input
              value={"http://localhost:47824"}
              style={{ width: 250 }}
              readOnly
              disabled={streamerOverlayEnabled === undefined ? false : !streamerOverlayEnabled}
            />
            <Tooltip label="Copy">
              <ActionIcon
                disabled={streamerOverlayEnabled === undefined ? false : !streamerOverlayEnabled}
                onClick={() => {
                  writeText("http://localhost:47824");
                }}
              >
                <IconCopy size="1.125rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Spoiler
            maxHeight={0}
            showLabel="Deprecated - local file streamerOverlay.html"
            hideLabel="Hide"
          >
            <div style={{ paddingLeft: 10 }}>
              <Text>
                Local file has issue with refresh flicker, we recommend local web server to avoid
                this issue.
              </Text>
              <Group>
                <Text>Path to streamerOverlay.html:</Text>
                <Input
                  value={appDataPath}
                  style={{ width: 500 }}
                  readOnly
                  disabled={
                    streamerOverlayEnabled === undefined ? false : !streamerOverlayEnabled
                  }
                />
                <Tooltip label="Copy">
                  <ActionIcon
                    disabled={
                      streamerOverlayEnabled === undefined ? false : !streamerOverlayEnabled
                    }
                    onClick={() => {
                      writeText(appDataPath);
                    }}
                  >
                    <IconCopy size="1.125rem" />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </div>
          </Spoiler>
        </Stack>
      </Box>
    </>
  );
};
