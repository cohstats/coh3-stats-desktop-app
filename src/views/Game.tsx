import { useGameData } from "../game-data-provider/GameDataProvider"
import { Title, Grid, Loader, Group, Box, Badge } from "@mantine/core"
import { PlayerCard } from "../components/PlayerCard"
import { useLogFilePath } from "../game-data-provider/configValues"
import { OnlinePlayers } from "../components/Online-players"

export const Game: React.FC = () => {
  const gameData = useGameData()
  const logFilePath = useLogFilePath()
  return (
    <>
      <>
        <Group justify={"space-between"}>
          <Group pt="xs" px="md" gap={"xs"}>
            Game State{" "}
            {gameData ? (
              <Badge> {gameData.gameData.state} </Badge>
            ) : (
              <Loader type="dots" size="md" />
            )}
          </Group>
          <Box pt="xs" px="md">
            <OnlinePlayers />
          </Box>
        </Group>
      </>
      {logFilePath !== undefined ? (
        <>
          {gameData && gameData.gameData.map.length > 0 ? (
            <>
              <Grid gutter={0} p={"md"} pt={0}>
                <Grid.Col span="auto" pt={40}>
                  {gameData.gameData.left.players.map((player, index) => (
                    <PlayerCard
                      key={player.relicID + " " + index}
                      {...player}
                    />
                  ))}
                </Grid.Col>
                <Grid.Col span="content">
                  <Title style={{ textAlign: "center" }} mx="sm">
                    VS
                  </Title>
                </Grid.Col>
                <Grid.Col span="auto" pt={40}>
                  {gameData.gameData.right.players.map((player, index) => (
                    <PlayerCard
                      key={player.relicID + " " + index}
                      {...player}
                    />
                  ))}
                </Grid.Col>
              </Grid>
            </>
          ) : (
            <Group justify="center" mt={50}>
              <Title>
                <Loader mr="md" />
                Waiting for a game
              </Title>
            </Group>
          )}
        </>
      ) : (
        <Group justify="center" mt={50}>
          <Title>
            <Loader mr="md" />
            Waiting for logfile
          </Title>
        </Group>
      )}
    </>
  )
}
