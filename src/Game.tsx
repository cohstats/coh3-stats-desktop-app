import { useGameData } from "./game-data-provider/GameDataProvider"
import {
    Title,
    Grid,
    Paper,
    Stack,
    Group,
    Text,
    Anchor,
    Tooltip,
} from "@mantine/core"

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
                                    {gameData.rawGameData.left.players.map(
                                        (player) => (
                                            <Paper
                                                key={player.relic_id}
                                                shadow="xs"
                                                withBorder
                                                p="md"
                                            >
                                                <Title
                                                    size="h3"
                                                    onClick={() =>
                                                        open(
                                                            "https://coh2stats.com/players/" +
                                                                player.steam_id
                                                        )
                                                    }
                                                >
                                                    <Tooltip label="Link to coh2 profile (might not exist)">
                                                        <Anchor>
                                                            {player.name}
                                                        </Anchor>
                                                    </Tooltip>
                                                </Title>
                                                <Text>
                                                    Faction: {player.faction}
                                                </Text>
                                                <Text>Rank: {player.rank}</Text>
                                            </Paper>
                                        )
                                    )}
                                </Grid.Col>
                                <Grid.Col span="content">
                                    <Title align="center" mx="sm">
                                        VS
                                    </Title>
                                </Grid.Col>
                                <Grid.Col span="auto" pt={40}>
                                    {gameData.rawGameData.right.players.map(
                                        (player) => (
                                            <Paper
                                                key={player.relic_id}
                                                shadow="xs"
                                                withBorder
                                                p="md"
                                            >
                                                <Title
                                                    size="h3"
                                                    onClick={() =>
                                                        open(
                                                            "https://coh2stats.com/players/" +
                                                                player.steam_id
                                                        )
                                                    }
                                                >
                                                    <Tooltip label="Link to coh2 profile (might not exist)">
                                                        <Anchor>
                                                            {player.name}
                                                        </Anchor>
                                                    </Tooltip>
                                                </Title>
                                                <Text>
                                                    Faction: {player.faction}
                                                </Text>
                                                <Text>Rank: {player.rank}</Text>
                                            </Paper>
                                        )
                                    )}
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
