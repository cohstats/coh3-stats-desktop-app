import { ColorSchemeToggle } from "coh-stats-components"
import {
    Box,
    Group,
    Stack,
    Divider,
    Input,
    ActionIcon,
    Text,
    List,
    Image,
    Button,
    Tooltip,
} from "@mantine/core"
import { appDataDir } from "@tauri-apps/api/path"
import { writeText } from "@tauri-apps/api/clipboard"
import { useEffect, useState } from "react"
import { IconCheck, IconCopy, IconX } from "@tabler/icons-react"
import { open } from "@tauri-apps/api/dialog"
import { trySetLogFilePath, useLogFilePath } from "./configStore"

export const Settings: React.FC = () => {
    const logFilePath = useLogFilePath()
    const [appDataPath, setAppDataPath] = useState<string>("")
    useEffect(() => {
        const getAppDataPath = async () => {
            const path = await appDataDir()
            setAppDataPath(path)
        }
        if (appDataPath === "") {
            getAppDataPath()
        }
    }, [appDataPath])

    const openDialog = async () => {
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
        })
        if (selected !== null) {
            trySetLogFilePath(selected as string)
        }
    }

    return (
        <>
            <Box p="xl">
                <Stack>
                    <Group>
                        <div>Color Theme:</div>
                        <div>
                            <ColorSchemeToggle />
                        </div>
                    </Group>
                    <Group>
                        <div>Path to warnings.log:</div>
                        <div>
                            <Group spacing="xs">
                                <Group spacing={3}>
                                    <Input
                                        readOnly
                                        value={logFilePath ? logFilePath : ""}
                                    />
                                    <Button
                                        variant="default"
                                        onClick={openDialog}
                                    >
                                        Select
                                    </Button>
                                </Group>
                                <Tooltip
                                    label={
                                        logFilePath !== undefined
                                            ? "Log file found"
                                            : "Could not find log file"
                                    }
                                >
                                    <ActionIcon
                                        variant="light"
                                        color={
                                            logFilePath !== undefined
                                                ? "green"
                                                : "red"
                                        }
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
                    <div>
                        <Text weight={700}>
                            OBS Streamer Overlay instructions:
                        </Text>
                        <List type="ordered">
                            <List.Item>
                                In OBS Sources section click on "Add Source" and
                                select Browser
                            </List.Item>
                            <List.Item>
                                In the Browser source settings tick "Local File"
                            </List.Item>
                            <List.Item>
                                <Text>Copy this path:</Text>{" "}
                                <Group>
                                    <Input
                                        value={appDataPath}
                                        style={{ width: 300 }}
                                        readOnly
                                    />
                                    <ActionIcon
                                        onClick={() => {
                                            writeText(appDataPath)
                                        }}
                                    >
                                        <IconCopy size="1.125rem" />
                                    </ActionIcon>
                                </Group>
                            </List.Item>
                            <List.Item>
                                In the Local File section click on "Browse"
                            </List.Item>
                            <List.Item>
                                An explorer window opens. Paste the copied path
                                into the path field shown in the image below:
                                <Image
                                    src={"/instructions/navigateToPath.png"}
                                    height={100}
                                />
                            </List.Item>
                            <List.Item>
                                Select the file "streamerOverlay.html" and click
                                on open
                            </List.Item>
                            <List.Item>
                                Set the Width to 1920 and the Height to 1080
                            </List.Item>
                            <List.Item>
                                Click ok. All Done! The overlay will display
                                player ranks only when loading or ingame!
                            </List.Item>
                        </List>
                    </div>
                </Stack>
            </Box>
        </>
    )
}
