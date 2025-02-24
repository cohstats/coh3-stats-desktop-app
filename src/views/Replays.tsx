import {
  Box,
  Group,
  Stack,
  Divider,
  Input,
  ActionIcon,
  Text,
  List,
  Button,
  Tooltip,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Flex,
  Space,
  Code,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { IconCheck, IconCopy, IconX } from "@tabler/icons-react";
import { open } from "@tauri-apps/api/dialog";
import { open as openLink } from "@tauri-apps/api/shell";
import { useAutoSyncReplays, usePlaybackPath } from "../game-data-provider/configValues";

import events from "../mixpanel/mixpanel";
import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen } from "@tauri-apps/api/event";
import { COHDBIcon } from "../components/other/COHDB-icon";
import { showNotification } from "../utils/notifications";
import { cohdbPlayerOverView } from "../utils/external-routes";
import HelperIcon from "../components/other/helper-icon";
import { writeText } from "@tauri-apps/api/clipboard";
import config from "../config";

interface CohdbUser {
  name: string;
  profile_id: number;
  steam_id: number;
}

export const Replays: React.FC = () => {
  const [playbackPath, setPlaybackPath] = usePlaybackPath();
  const [autoSyncReplays, setAutoSyncReplays] = useAutoSyncReplays();
  const [cohdbUser, setCohdbUser] = useState<CohdbUser | null>(null);

  useEffect(() => {
    events.open_replays().then();
  }, []);

  useEffect(() => {
    const getCohdbUser = async () => {
      const user = (await invoke("plugin:cohdb|connected")) as CohdbUser | null;
      setCohdbUser(user);
    };

    const unlisten = listen<CohdbUser | null>("cohdb:connection", (event) => {
      getCohdbUser();
      if (event.payload != null) {
        showNotification({
          title: "Successfully connected to cohdb!",
          message: "You can close the browser window now",
          type: "success",
        });
      }
    });

    getCohdbUser();

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const openPlaybackDialog = async () => {
    const selected = await open({
      title: "Select CoH3 playback directory",
      multiple: false,
      directory: true,
      defaultPath: playbackPath,
    });
    if (selected !== null) {
      events.settings_changed("playbackPath", selected as string);
      setPlaybackPath(selected as string).then(() => emit("playback-dir-changed", selected));
    }
  };

  return (
    <>
      <Box p="xl" pt={"md"}>
        <Flex justify="space-between" align="flex-start">
          <Paper p="xs" pt={0} pl={0} w={570}>
            <Title order={3}>
              Replay integration with{" "}
              <Anchor inherit onClick={() => openLink(config.COHDB_BASE_URL)}>
                cohdb.com
              </Anchor>
            </Title>
            <Text data-testid="replays-description">
              Automatically upload replays to cohdb for replay analysis
            </Text>
            <List type="ordered" withPadding>
              <List.Item>Authenticate with cohdb</List.Item>
              <List.Item>Validate path to replay folder</List.Item>
              <List.Item>
                <Group gap={4}>
                  Enjoy automatic upload to cohdb.com
                  <HelperIcon
                    content={
                      <>
                        <Text>It automatically syncs replays only when the game ends.</Text>
                        <Text>
                          Currently you can't sync past replays. Only replays where the player
                          played can be synced.
                        </Text>
                      </>
                    }
                  />
                </Group>
              </List.Item>
            </List>
            <Text fs="italic" size="sm" pt="xs">
              It's recommended to enable autosync even when you don't want to share it with
              anyone. If we gather enough replays, we could start providing new types of
              statistics and analysis.
            </Text>
          </Paper>
          <Group>
            {cohdbUser != null ? (
              <Stack>
                <Title order={4}>
                  Connected as{" "}
                  <Anchor inherit onClick={() => openLink(cohdbPlayerOverView())}>
                    {cohdbUser.name}
                  </Anchor>{" "}
                  at <COHDBIcon size={18} />
                </Title>

                <Button
                  variant="default"
                  onClick={() => {
                    invoke("plugin:cohdb|disconnect");
                    events.disconnect_coh_db();
                  }}
                  size={"compact-md"}
                >
                  Disconnect
                </Button>
              </Stack>
            ) : (
              <Button
                variant="default"
                onClick={async () => {
                  const authUrl = await invoke("plugin:cohdb|authenticate");
                  events.connect_coh_db();

                  showNotification({
                    title: "Opening browser window",
                    message: (
                      <>
                        If it didn't open, please copy this url into your browser:
                        <Space h={"xs"} />
                        <Group gap={"xs"} wrap="nowrap">
                          <Tooltip label="Copy">
                            <ActionIcon
                              onClick={() => {
                                writeText(`${authUrl}`);
                              }}
                            >
                              <IconCopy size="22" />
                            </ActionIcon>
                          </Tooltip>
                          <Code block>{`${authUrl}`}</Code>
                        </Group>
                      </>
                    ),
                    type: "info",
                    autoCloseInMs: 20000,
                  });
                }}
              >
                <span style={{ paddingRight: 10 }}>
                  <COHDBIcon />
                </span>{" "}
                Authenticate with cohdb
              </Button>
            )}
          </Group>
        </Flex>
        <Stack>
          <Space />
          <Divider />

          {cohdbUser != null && (
            <div>
              <Group>
                <Group gap={4}>
                  <>Path to playback directory:</>
                  <HelperIcon
                    toolTipWidth={650}
                    content={
                      <>
                        <Text>
                          This is the path to the folder, where your game store replays file.
                        </Text>
                        <Text>
                          The default path is{" "}
                          <Code>
                            C:\Users\{"<YOUR USERNAME>"}\Documents\My Games\Company of Heroes
                            3\playback
                          </Code>
                        </Text>
                        <Text>
                          However sometimes when you have (OneDrive / Dropbox) installed on your
                          system, this path might be different.
                        </Text>
                      </>
                    }
                  />
                </Group>
                <div>
                  <Group gap="xs">
                    <Group gap={3}>
                      <Input
                        value={playbackPath ? playbackPath : ""}
                        style={{ width: 500 }}
                        readOnly
                      />
                      <Button variant="default" onClick={openPlaybackDialog}>
                        Select
                      </Button>
                    </Group>
                    <Tooltip
                      label={
                        playbackPath !== undefined
                          ? "Playback directory found"
                          : "Could not find playback directory"
                      }
                    >
                      <ActionIcon
                        variant="light"
                        color={playbackPath !== undefined ? "green" : "red"}
                        radius="xl"
                      >
                        {playbackPath !== undefined ? (
                          <IconCheck size="1.125rem" />
                        ) : (
                          <IconX size="1.125rem" />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </div>
              </Group>
              <Space h={"xs"} />
              <Checkbox
                label="AutoSync Replays"
                labelPosition="left"
                size={"md"}
                checked={autoSyncReplays === undefined ? true : autoSyncReplays}
                onChange={(event) => {
                  events.settings_changed("autoSyncReplays", `${!event.currentTarget.checked}`);
                  setAutoSyncReplays(event.currentTarget.checked);
                }}
              />
            </div>
          )}
        </Stack>
      </Box>
    </>
  );
};
