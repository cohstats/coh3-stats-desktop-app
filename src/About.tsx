import { getVersion } from "@tauri-apps/api/app"
import { open } from "@tauri-apps/api/shell"
import { useState, useEffect } from "react"
import {
    Navbar,
    AppShell,
    Stack,
    Title,
    Code,
    Text,
    Group,
    Anchor,
    Divider,
    Button,
    Space,
    Box,
    Grid,
} from "@mantine/core"
import logoBig from "./assets/logo/Square310x310Logo.png"

export const About: React.FC = () => {
    const [appVersion, setAppVersion] = useState<string>()
    useEffect(() => {
        getVersion().then((version) => setAppVersion(version))
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
                    <Group spacing="xs">
                        <Text fw={600}>Version </Text>
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
                        <Anchor
                            onClick={() => open("https://coh3stats.com/about")}
                        >
                            make a donation
                        </Anchor>{" "}
                        or{" "}
                        <Anchor
                            onClick={() =>
                                open("https://discord.gg/jRrnwqMfkr")
                            }
                        >
                            join our discord and get involved!
                        </Anchor>
                    </Text>
                    <Button onClick={() => open("https://ko-fi.com/cohstats")}>
                        <Group spacing="xs">
                            <img
                                src="https://storage.ko-fi.com/cdn/cup-border.png"
                                alt="Ko-fi donations"
                                width={20}
                            />
                            Donate
                        </Group>
                    </Button>
                </Grid.Col>
            </Grid>
        </>
    )
}
