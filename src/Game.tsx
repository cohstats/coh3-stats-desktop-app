import { useGameData } from "./game-data-provider/GameDataProvider"
import { Title, Grid } from "@mantine/core"
import { PlayerCard } from "./components/PlayerCard"

export const Game: React.FC = () => {
    const gameData = useGameData()
    console.log("gamedata", gameData)
    return (
        <>
            {gameData.logFileFound ? (
                <>
                    {gameData.gameData.timestamp.length > 0 ? (
                        <>
                            <Grid gutter={0}>
                                <Grid.Col span="auto" pt={40}>
                                    {gameData.gameData.left.players.map(
                                        (player) => (
                                            <PlayerCard
                                                key={player.relicID}
                                                {...player}
                                            />
                                        )
                                    )}
                                </Grid.Col>
                                <Grid.Col span="content">
                                    <Title align="center" mx="sm">
                                        VS
                                    </Title>
                                </Grid.Col>
                                <Grid.Col span="auto" pt={40}>
                                    {gameData.gameData.right.players.map(
                                        (player) => (
                                            <PlayerCard
                                                key={player.relicID}
                                                {...player}
                                            />
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
