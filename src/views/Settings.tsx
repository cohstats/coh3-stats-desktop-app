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
  Modal,
  Image,
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
import { usePlaySound, usePlaySoundVolume } from "../game-found/gameSoundConfigValues";
import { useAutoSwitchToGame } from "../game-found/autoSwitchConfigValues";
import { useBringToFrontOnGameFound } from "../game-found/bringToFrontConfigValues";
import { useAutoMuteEnabled, useMuteOnlyOutOfGame } from "../game-found/audioMuteConfigValues";
import {
  useShowFlagsOverlay,
  useAlwaysShowOverlay,
  useStreamerOverlayEnabled,
} from "../streamer-overlay/configValues";
import { playSound as playSoundFunc } from "../game-found/playSound";
import events from "../mixpanel/mixpanel";
import { useGameData } from "../game-data-provider/GameDataProvider";
import { relaunch } from "@tauri-apps/plugin-process";
import { getMapsUrlOnCDN } from "../utils/utils";
import { MapViewSettings } from "../game-data-provider/GameData-types";
import { ColorSchemeToggle } from "../components/ToggleCollorShemeButton";
import { useFontScale } from "../config-store/fontScaleConfig";
import config from "../config";
import { Link } from "react-router";
import { Routes } from "../Router";

export const Settings: React.FC = () => {
  const gameData = useGameData();
  const [logFilePath, setLogFilePath] = useLogFilePath();
  const [playSound, setPlaySound] = usePlaySound();
  const [playSoundVolume, setPlaySoundVolume] = usePlaySoundVolume();
  const [autoSwitchToGame, setAutoSwitchToGame] = useAutoSwitchToGame();
  const [bringToFrontOnGameFound, setBringToFrontOnGameFound] = useBringToFrontOnGameFound();
  const [autoMuteEnabled, setAutoMuteEnabled] = useAutoMuteEnabled();
  const [muteOnlyOutOfGame, setMuteOnlyOutOfGame] = useMuteOnlyOutOfGame();
  const [showFlagsOverlay, setShowFlagsOverlay] = useShowFlagsOverlay();
  const [alwaysShowOverlay, setAlwaysShowOverlay] = useAlwaysShowOverlay();
  const [mapViewSettings, setMapViewSettings] = useMapViewSettings();
  const [showExtendedPlayerInfo, setShowExtendedPlayerInfo] = useShowExtendedPlayerInfo();
  const [fontScale, setFontScale] = useFontScale();

  const [streamerOverlayEnabled, setStreamerOverlayEnabled] = useStreamerOverlayEnabled();
  const [appDataPath, setAppDataPath] = useState<string>("");
  const [restartRequired, setRestartRequired] = useState<boolean>(false);
  const [friendsGroupModalOpened, setFriendsGroupModalOpened] = useState<boolean>(false);

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
                <Group gap={"xs"}>
                  <Input
                    value={logFilePath ? logFilePath : ""}
                    style={{ width: 500 }}
                    readOnly
                    data-testid="log-file-path-input"
                  />
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
          <Text fw={700}>When game is found</Text>
          <Stack gap="md" pl="md">
            <Group>
              <Checkbox
                checked={playSound === undefined ? false : playSound}
                onChange={(event) => {
                  events.settings_changed("play_sound", `${event.currentTarget.checked}`);
                  setPlaySound(event.currentTarget.checked);
                }}
              />
              <div>Play sound</div>
              <Tooltip label="Play sound">
                <ActionIcon radius="xl" variant="filled" color="blue" onClick={playSoundFunc}>
                  <IconPlayerPlay size="1.125rem" />
                </ActionIcon>
              </Tooltip>
              <Text>Volume</Text>
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
            </Group>

            <Group>
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
              <Tooltip
                multiline
                w={450}
                label="When the game is found, the COH3 Desktop App will automatically switch to the game tab."
              >
                <div>
                  Switch to game tab <IconInfoCircle size={20} style={{ marginBottom: -4 }} />
                </div>
              </Tooltip>
            </Group>

            <Group>
              <div>
                <Checkbox
                  checked={
                    bringToFrontOnGameFound === undefined ? false : bringToFrontOnGameFound
                  }
                  onChange={(event) => {
                    events.settings_changed(
                      "bring_to_front_on_game_found",
                      `${event.currentTarget.checked}`,
                    );
                    setBringToFrontOnGameFound(event.currentTarget.checked);
                  }}
                />
              </div>
              <Tooltip
                multiline
                w={450}
                label="It will bring the App to front (on top of other windows) in Windows."
              >
                <div>
                  Bring App to front <IconInfoCircle size={20} style={{ marginBottom: -4 }} />
                </div>
              </Tooltip>
            </Group>
          </Stack>
          <Divider />
          <Text fw={700}>Game Audio Control</Text>
          <Stack gap="md" pl="md">
            <Group>
              <div>
                <Checkbox
                  checked={autoMuteEnabled ?? true}
                  onChange={(event) => {
                    events.settings_changed("autoMuteEnabled", `${event.currentTarget.checked}`);
                    setAutoMuteEnabled(event.currentTarget.checked);
                  }}
                />
              </div>
              <Tooltip
                multiline
                w={300}
                label="Automatically mute Company of Heroes 3 when the game window is not in focus"
              >
                <div>
                  Auto-mute game when not in foreground{" "}
                  <IconInfoCircle size={20} style={{ marginBottom: -4 }} />
                </div>
              </Tooltip>
            </Group>

            <Group>
              <div>
                <Checkbox
                  disabled={!autoMuteEnabled}
                  checked={muteOnlyOutOfGame ?? false}
                  onChange={(event) => {
                    events.settings_changed(
                      "muteOnlyOutOfGame",
                      `${event.currentTarget.checked}`,
                    );
                    setMuteOnlyOutOfGame(event.currentTarget.checked);
                  }}
                />
              </div>
              <Tooltip
                multiline
                w={300}
                label="When enabled, the game will only be muted in the Menu, not during Loading or active gameplay. WARNING! The game / menu detection is not 100% accurate."
              >
                <div>
                  Only mute when in Menu <IconInfoCircle size={20} style={{ marginBottom: -4 }} />
                </div>
              </Tooltip>
            </Group>
          </Stack>
          <Divider />
          <Group>
            <Checkbox
              data-testid="show-extended-player-info-checkbox"
              checked={showExtendedPlayerInfo === undefined ? false : showExtendedPlayerInfo}
              onChange={(event) => {
                events.settings_changed(
                  "show_extended_player_info",
                  `${event.currentTarget.checked}`,
                );
                setShowExtendedPlayerInfo(event.currentTarget.checked);
              }}
            />
            <Tooltip
              multiline
              w={600}
              label="Shows best rank and mode for a given faction. Total WinRate for the given faction across all modes. And overall winrate in all games."
            >
              <div>
                Show extended player info{" "}
                <IconInfoCircle size={20} style={{ marginBottom: -4 }} />{" "}
              </div>
            </Tooltip>

            <div>
              <Group>
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
            <Tooltip
              label={
                "Friends Groups Detection is available only in Microsoft Store Edition due to extensive API calls required."
              }
            >
              <Checkbox disabled checked={config.MS_STORE_EDITION} />
            </Tooltip>
            <div>Friends Groups Detection</div>
            <Button
              variant="default"
              size="compact-xs"
              // leftSection={<IconInfoCircle size={16} />}
              onClick={() => setFriendsGroupModalOpened(true)}
            >
              Learn More
            </Button>
          </Group>

          <Modal
            opened={friendsGroupModalOpened}
            onClose={() => setFriendsGroupModalOpened(false)}
            title="Friends Groups Detection"
            size="xl"
            centered
          >
            <Stack gap="sm">
              <Text size="sm">
                The default arranged team detection works only when all players from the group
                played together as team. However the Friends Group Detection can show partial
                teams (for example 3 man team + 1 random), it can also combine players across
                various teams, detecting possible new groups which never played together before
                but they are friends.
              </Text>
              <Text size="sm" fw={700}>
                Friends Group detection is available only in Microsoft Store Edition due to
                extensive API calls required.{" "}
              </Text>
              <Text size="sm" fw={700}>
                <Anchor component={Link} to={Routes.ABOUT}>
                  Learn more about MS Store Edition
                </Anchor>
              </Text>
              <Image
                src="/friends-group-detection.png"
                alt="Friends Groups Detection Example"
                style={{ borderRadius: 7 }}
              />
            </Stack>
          </Modal>
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
              height={50}
              style={{
                objectFit: "cover",
                borderRadius: 7,
              }}
            />
          </Group>
          <Group>
            <div data-testid="color-scheme-toggle">
              <ColorSchemeToggle />
            </div>
            <div>Color Theme</div>
          </Group>
          <Group>
            <div>Font Scale:</div>
            <Group gap="md">
              <Slider
                min={0.7}
                max={1.2}
                step={0.1}
                style={{ width: "200px" }}
                label={(value) => `${Math.round(value * 100)}%`}
                value={fontScale ?? 1.0}
                onChange={setFontScale}
                onChangeEnd={(value) => {
                  events.settings_changed("fontScale", value);
                }}
                marks={[
                  { value: 0.7, label: "70%" },
                  { value: 0.8, label: "80%" },
                  { value: 0.9, label: "90%" },
                  { value: 1.0, label: "100%" },
                  { value: 1.1, label: "110%" },
                  { value: 1.2, label: "120%" },
                ]}
              />
            </Group>
          </Group>
          <Divider mt={"md"} />
          <Group>
            <Text fw={700}>OBS Streamer Overlay</Text>
            <Switch
              data-testid="obs-overlay-toggle"
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
                    data-testid="obs-restart-button"
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
                data-testid="obs-only-show-ingame-checkbox"
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
            <div>Only show stats when loading / ingame</div>
          </Group>
          <Group>
            <div>
              <Checkbox
                data-testid="obs-show-flags-checkbox"
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
            <div>Show flags</div>
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
