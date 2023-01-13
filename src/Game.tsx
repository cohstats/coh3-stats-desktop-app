import { useGameData } from "./game-data-provider/GameDataProvider"
import { Title, Grid, Paper, Stack, Group, Text } from "@mantine/core"

export const Game: React.FC = () => {
    const gameData = useGameData()
    console.log("gamedata", gameData)
    return (
        <>
            {gameData.logFileFound ? (
                <>
                    {gameData.rawGameData.timestamp.length > 0 ? (
                        <>
                            <Grid gutter={0}>
                                <Grid.Col span="auto" pt={40}>
                                    <Paper shadow="xs" withBorder p="md">
                                        <Group>
                                            <Group spacing={0} align="start">
                                                <Title>40</Title>
                                                <Title size="h5" pt={4}>
                                                    th
                                                </Title>
                                            </Group>
                                            <Group spacing={6}>
                                                <Title size="h3">
                                                    {
                                                        gameData.rawGameData
                                                            .left.players[0]
                                                            .name
                                                    }
                                                </Title>
                                                <img
                                                    src={"/flags/4x3/ac.svg"}
                                                    width={20}
                                                />
                                            </Group>
                                            <Stack spacing={0}>
                                                <Title size="h5">59%</Title>
                                                <Text
                                                    c="green"
                                                    size={14}
                                                    weight={700}
                                                >
                                                    WR
                                                </Text>
                                            </Stack>
                                            <Stack spacing={0}>
                                                <Title size="h5">+4</Title>
                                                <Text
                                                    c="green"
                                                    size={14}
                                                    weight={700}
                                                >
                                                    STREAK
                                                </Text>
                                            </Stack>
                                        </Group>
                                    </Paper>
                                    <Paper>Player 2</Paper>
                                    <Paper>Player 3</Paper>
                                    <Paper>Player 4</Paper>
                                </Grid.Col>
                                <Grid.Col span="content">
                                    <Title align="center" mx="sm">
                                        VS
                                    </Title>
                                </Grid.Col>
                                <Grid.Col span="auto" pt={40}>
                                    <Paper shadow="xs" withBorder p="md">
                                        <Title size="h3">
                                            {
                                                gameData.rawGameData.right
                                                    .players[0].name
                                            }
                                        </Title>
                                        {
                                            gameData.rawGameData.right
                                                .players[0].faction
                                        }
                                    </Paper>
                                    <Paper>Player 2</Paper>
                                    <Paper>Player 3</Paper>
                                    <Paper>Player 4</Paper>
                                </Grid.Col>
                            </Grid>
                        </>
                    ) : null}
                </>
            ) : (
                <>Could not find Log File</>
            )}
        </>
    )
}
