import { getVersion } from "@tauri-apps/api/app"
import { appDataDir } from "@tauri-apps/api/path"
import { open } from "@tauri-apps/api/shell"
import React, { useState, useEffect } from "react"
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
} from "@mantine/core"
import logoBig from "../assets/logo/Square310x310Logo.png"
import events from "../mixpanel/mixpanel"

export const About: React.FC = () => {
  const [appVersion, setAppVersion] = useState<string>()
  const [pathToLogs, setPathToLogs] = useState<string>()

  useEffect(() => {
    getVersion().then((version) => setAppVersion(version))
    events.open_about()
    appDataDir().then((path) => setPathToLogs(path))
  }, [])

  return (
    <>
      <Title size="h3" p="md">
        About the App
      </Title>
      <Divider p="xs" />
      <Grid style={{ margin: 0 }}>
        <Grid.Col span="content">
          <img src={logoBig} alt="Coh3Stats Logo" width={200} />
        </Grid.Col>
        <Grid.Col span="auto" pt="md">
          <Group gap="xs">
            <Title order={4}>Version </Title>
            <Code color="green">{appVersion}</Code>
          </Group>
          <Text component="p" size="sm">
            Visit our website{" "}
            <Anchor onClick={() => open("https://coh3stats.com/")}>
              coh3stats.com
            </Anchor>
            .
          </Text>
          <Text component="p" size="sm">
            Want to help?{" "}
            <Anchor
              onClick={() =>
                open(
                  "https://github.com/cohstats/coh3-stats-desktop-app/issues"
                )
              }
            >
              Report a bug
            </Anchor>
            ,{" "}
            <Anchor onClick={() => open("https://coh3stats.com/about")}>
              make a donation
            </Anchor>{" "}
            or{" "}
            <Anchor onClick={() => open("https://discord.gg/jRrnwqMfkr")}>
              join our discord and get involved!
            </Anchor>
          </Text>
          <Space h={"xs"} />
          <Title order={4}>Reporting a bug</Title>
          <Text component="p" size="sm">
            In case of issues please, please try to report them in Discord
            sections bugs-and-questions with as much details as possible.
            <br />
            Also try to provide the warnings.log file from:
            <br />{" "}
            <Code>
              {" "}
              C:\Users\Username\Documents\My Games\Company of Heroes
              3\warnings.log
            </Code>
            <br />
            <br />
            You can also provide the logs from the COH3 Stats Desktop app which
            are located here:
            <br />
            <Code>{pathToLogs}logs</Code>
          </Text>
          <Space h={"xs"} />
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
        </Grid.Col>
      </Grid>
    </>
  )
}
