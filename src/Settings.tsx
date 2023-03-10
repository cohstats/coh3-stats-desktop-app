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
    Checkbox,
    Slider,
} from "@mantine/core"
import { appDataDir } from "@tauri-apps/api/path"
import { writeText } from "@tauri-apps/api/clipboard"
import { useEffect, useState } from "react"
import { IconCheck, IconCopy, IconPlayerPlay, IconX } from "@tabler/icons-react"
import { open } from "@tauri-apps/api/dialog"
import { useLogFilePath } from "./game-data-provider/configValues"
import {
    usePlaySound,
    usePlaySoundVolume,
} from "./game-found-sound/configValues"
import {
    useShowFlagsOverlay,
    useAlwaysShowOverlay,
} from "./streamer-overlay/configValues"
import { playSound as playSoundFunc } from "./game-found-sound/playSound"
import events from "./mixpanel/mixpanel"
import { useGameData } from "./game-data-provider/GameDataProvider"

export const Settings: React.FC = () => {
    const gameData = useGameData()
    const [logFilePath, setLogFilePath] = useLogFilePath()
    const [playSound, setPlaySound] = usePlaySound()
    const [playSoundVolume, setPlaySoundVolume] = usePlaySoundVolume()
    const [showFlagsOverlay, setShowFlagsOverlay] = useShowFlagsOverlay()
    const [alwaysShowOverlay, setAlwaysShowOverlay] = useAlwaysShowOverlay()
    const [appDataPath, setAppDataPath] = useState<string>("")

    useEffect(() => {
        events.open_settings()
    }, [])

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
            events.settings_changed("logFilePath", selected as string)
            setLogFilePath(selected as string)
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
                    <Group>
                        <div>Play sound on match found:</div>
                        <div>
                            <Group>
                                <Checkbox
                                    checked={
                                        playSound === undefined
                                            ? false
                                            : playSound
                                    }
                                    onChange={(event) => {
                                        events.settings_changed(
                                            "play_sound",
                                            `${event.currentTarget.checked}`
                                        )
                                        setPlaySound(
                                            event.currentTarget.checked
                                        )
                                    }}
                                />
                                <Text>Volume:</Text>
                                <Slider
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    style={{ width: "100px" }}
                                    value={playSoundVolume}
                                    onChange={setPlaySoundVolume}
                                    onChangeEnd={(value) => {
                                        events.settings_changed(
                                            "play_sound_volume",
                                            value
                                        )
                                    }}
                                />
                                <ActionIcon
                                    radius="xl"
                                    variant="filled"
                                    color="blue"
                                    onClick={playSoundFunc}
                                >
                                    <IconPlayerPlay size="1.125rem" />
                                </ActionIcon>
                            </Group>
                        </div>
                    </Group>
                    <Divider />
                    <Text weight={700}>OBS Streamer Overlay:</Text>
                    <Group>
                        <div>Only show stats when loading / ingame:</div>
                        <div>
                            <Checkbox
                                checked={
                                    alwaysShowOverlay === undefined
                                        ? true
                                        : !alwaysShowOverlay
                                }
                                onChange={(event) => {
                                    events.settings_changed(
                                        "alwaysShowOverlay",
                                        `${!event.currentTarget.checked}`
                                    )
                                    setAlwaysShowOverlay(
                                        !event.currentTarget.checked
                                    )
                                    if (gameData) {
                                        gameData.reloadLogFile()
                                    }
                                }}
                            />
                        </div>
                    </Group>
                    <Group>
                        <div>Show flags:</div>
                        <div>
                            <Checkbox
                                checked={
                                    showFlagsOverlay === undefined
                                        ? false
                                        : showFlagsOverlay
                                }
                                onChange={(event) => {
                                    events.settings_changed(
                                        "showFlagsOverlay",
                                        `${event.currentTarget.checked}`
                                    )
                                    setShowFlagsOverlay(
                                        event.currentTarget.checked
                                    )
                                    if (gameData) {
                                        gameData.reloadLogFile()
                                    }
                                }}
                            />
                        </div>
                    </Group>
                    <div>
                        <Text weight={700}>Setup instructions:</Text>
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
