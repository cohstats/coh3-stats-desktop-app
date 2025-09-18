import { getVersion, getName } from "@tauri-apps/api/app";
import { appDataDir } from "@tauri-apps/api/path";
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
import logoBig from "../assets/logo/Square310x310Logo.png";
import events from "../mixpanel/mixpanel";
import config from "../config";
import { DiscordIcon } from "../components/other/Discord-icon";

export const About: React.FC = () => {
  const [appVersion, setAppVersion] = useState<string>();
  const [pathToLogs, setPathToLogs] = useState<string>();
  const [appName, setAppName] = useState<string>();

  const [latestVersion, setLatestVersion] = useState<string>();

  useEffect(() => {
    (async () => {
      getVersion().then((version) => setAppVersion(version));
      events.open_about();
      appDataDir().then((path) => setPathToLogs(path));
      getName().then((name) => setAppName(name));

      fetch("https://coh3stats.com/api/appUpdateRoute")
        .then((response) => {
          // @ts-ignore
          setLatestVersion(response.data.version.replace("v", ""));
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
          {latestVersion !== appVersion && latestVersion !== undefined && (
            <>
              <Space h="xs" />
              <Text component="p" size="sm" c={"red"}>
                The latest production version is reported as {latestVersion}. If the autoupdater
                doesn't work pelase download the new version manually{" "}
                <Anchor
                  href="https://coh3stats.com/desktop-app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  coh3stats.com/desktop-app
                </Anchor>{" "}
                and reinstall the application.
              </Text>
              <Space h="xs" />
            </>
          )}
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
        <Code>{pathToLogs}logs</Code>
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
