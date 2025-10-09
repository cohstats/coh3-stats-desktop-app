import { getVersion, getName } from "@tauri-apps/api/app";
import { appLocalDataDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-shell";
import { fetch } from "@tauri-apps/plugin-http";
import React, { useState, useEffect } from "react";
import {
  Title,
  Code,
  Text,
  Group,
  Anchor,
  Divider,
  Button,
  Grid,
  Space,
  Box,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import logoBig from "../assets/logo/Square310x310Logo.png";
import events from "../mixpanel/mixpanel";
import config from "../config";
import { DiscordIcon } from "../components/other/Discord-icon";
import { useUpdater } from "../providers/UpdaterProvider";

/**
 * Compare two semantic version strings
 * @param version1 - First version string (e.g., "2.0.1")
 * @param version2 - Second version string (e.g., "2.0.0")
 * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split(".").map(Number);
  const v2Parts = version2.split(".").map(Number);

  const maxLength = Math.max(v1Parts.length, v2Parts.length);

  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part < v2Part) return -1;
    if (v1Part > v2Part) return 1;
  }

  return 0;
};

export const About: React.FC = () => {
  const [appVersion, setAppVersion] = useState<string>();
  const [pathToLogs, setPathToLogs] = useState<string>();
  const [appName, setAppName] = useState<string>();

  const [latestVersion, setLatestVersion] = useState<string>();

  const { checkForUpdates, updateAvailable, isChecking, showUpdateModal } = useUpdater();

  useEffect(() => {
    (async () => {
      getVersion().then((version) => setAppVersion(version));
      events.open_about();
      appLocalDataDir().then((path) => setPathToLogs(path));
      getName().then((name) => setAppName(name));

      fetch(config.COHS3STATS_API_UPDATE_ROUTE)
        .then(async (response) => {
          const data = await response.json();
          setLatestVersion(data.version.replace("v", ""));
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    })();
  }, []);

  return (
    <Box p="xl" pt={"md"}>
      {/* Top section with logo and version info */}
      <Grid style={{ margin: 0 }}>
        <Grid.Col span="auto">
          <Title size="h3">About - {appName}</Title>
          <Divider p="xs" mt={"xs"} />
          <Group gap="xs">
            <Title order={4}>Version </Title>
            <Code color="green" data-testid="app-version">
              {appVersion}
            </Code>
          </Group>
          {config.UPDATER_DISABLED && (
            <Text component="p" size="sm" c="dimmed" mt="xs">
              Microsoft Store Edition - Updates are managed through the Microsoft Store
            </Text>
          )}
          {!config.UPDATER_DISABLED &&
            latestVersion !== appVersion &&
            latestVersion !== undefined &&
            appVersion &&
            (() => {
              const versionComparison = compareVersions(appVersion, latestVersion);

              if (versionComparison < 0) {
                // Current version is older than latest
                return (
                  <>
                    <Space h="xs" />
                    <Text component="p" size="sm" c={"red"}>
                      The latest production version is reported as {latestVersion}.
                    </Text>
                    <Group gap="xs" mt="xs">
                      <Button
                        size="xs"
                        leftSection={<IconDownload size={16} />}
                        onClick={() => {
                          if (updateAvailable) {
                            showUpdateModal();
                          } else {
                            checkForUpdates();
                          }
                        }}
                        loading={isChecking}
                      >
                        {updateAvailable ? "Install Update" : "Check for Updates"}
                      </Button>
                      <Text component="span" size="sm" c="dimmed">
                        or{" "}
                        <Anchor
                          href="https://coh3stats.com/desktop-app"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          download manually
                        </Anchor>
                      </Text>
                    </Group>
                    <Space h="xs" />
                  </>
                );
              } else if (versionComparison > 0) {
                // Current version is newer than latest
                return (
                  <>
                    <Space h="xs" />
                    <Text component="p" size="sm" c={"yellow"}>
                      Your current version ({appVersion}) is newer than the last reported stable
                      version ({latestVersion}). If you experience any issues, you can download
                      the latest stable version from{" "}
                      <Anchor
                        href="https://coh3stats.com/desktop-app"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        coh3stats.com/desktop-app
                      </Anchor>
                      .
                    </Text>
                    <Space h="xs" />
                  </>
                );
              }

              return null;
            })()}
          <Text component="p" size="sm">
            Visit our website{" "}
            <Anchor onClick={() => open(config.COH3STATS_BASE_ULR)}>coh3stats.com</Anchor>.
          </Text>
          <Text component="p" size="sm">
            Want to help?{" "}
            <Anchor
              onClick={() => open("https://github.com/cohstats/coh3-stats-desktop-app/issues")}
            >
              Report a bug
            </Anchor>
            , <Anchor onClick={() => open("https://coh3stats.com/about")}>make a donation</Anchor>{" "}
            or{" "}
            <Anchor onClick={() => open(config.DISCORD_JOIN_LINK)}>
              join our discord and get involved!
            </Anchor>
          </Text>
        </Grid.Col>
        <Grid.Col span="content" pl={"md"}>
          <img src={logoBig} alt="Coh3Stats Logo" width={130} />
        </Grid.Col>
      </Grid>
      <Group>
        <Button onClick={() => open("https://ko-fi.com/cohstats")}>
          <Group gap="xs">
            <img
              src="https://storage.ko-fi.com/cdn/cup-border.png"
              alt="Ko-fi donations"
              width={18}
            />
            Donate
          </Group>
        </Button>
        <DiscordIcon />
      </Group>
      <Space h={"md"} />

      {/* Full-width content sections */}
      <Divider />
      <Space h={"xs"} />

      <Title order={4}>Arranged Teams</Title>
      <Text component="p" size="sm">
        <Anchor onClick={() => open("https://coh3stats.com/about#arrangedteams")}>
          Learn more about arranged teams
        </Anchor>{" "}
        and how they work in Company of Heroes 3.
      </Text>

      <Space h={"xs"} />
      <Title order={4}>Reporting a bug</Title>
      <Text component="p" size="sm">
        In case of issues please, please try to report them in Discord sections bugs-and-questions
        with as much details as possible. Including warnings.log{" "}
        <Code> C:\Users\Username\Documents\My Games\Company of Heroes 3\warnings.log</Code>
        <br />
        <br />
        You can also provide the logs from the COH3 Stats Desktop app which are located here:
        <br />
        <Code>{pathToLogs}\logs</Code>
      </Text>

      <Space h={"lg"} />
      <Title order={4}>Donate</Title>
      <Text component="p" size="sm">
        COH3 Stats provides comprehensive analytics and real-time data processing for the Company
        of Heroes 3 community. Running these services requires significant server resources and
        bandwidth, which come with ongoing costs.
      </Text>
      <Text component="p" size="sm">
        Your donations help cover server expenses and platform improvements. Every contribution
        directly supports the infrastructure that keeps COH3 Stats running smoothly.
      </Text>
      <Text component="p" size="sm">
        We're grateful to everyone who has supported us. Your generosity enables us to provide
        these services free to the entire COH3 community. Thank you!
      </Text>
      <Space h={"xs"} />
      <Group>
        <Button onClick={() => open("https://ko-fi.com/cohstats")}>
          <Group gap="xs">
            <img
              src="https://storage.ko-fi.com/cdn/cup-border.png"
              alt="Ko-fi donations"
              width={18}
            />
            Donate
          </Group>
        </Button>
        <DiscordIcon />
      </Group>

      <Space h={"lg"} />
      <Text component="p" size="sm">
        © 2023 - 2025 COH Stats
      </Text>
    </Box>
  );
};
