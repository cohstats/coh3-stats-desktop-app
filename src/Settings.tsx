import { useGameData } from "./game-data-provider/GameDataProvider"
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
} from "@mantine/core"
import { appDataDir } from "@tauri-apps/api/path"
import { writeText } from "@tauri-apps/api/clipboard"
import { useEffect, useState } from "react"
import { IconCopy } from "@tabler/icons-react"

export const Settings: React.FC = () => {
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
