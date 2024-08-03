import {
  factionShortcuts,
  FullPlayerData,
  GameDataTypes,
} from "../game-data-provider/GameData-types"
import {
  Anchor,
  Divider,
  Flex,
  Grid,
  HoverCard,
  Image,
  Paper,
  Text,
} from "@mantine/core"
import { IconInfoCircle, IconSwords } from "@tabler/icons-react"
import React, { useContext } from "react"
import { MapStatsContext } from "../map-stats-provider"
import { open as openLink } from "@tauri-apps/api/shell"
import config from "../config"
import events from "../mixpanel/mixpanel"

interface MapCardProps {
  gameData: GameDataTypes
}

const TotalElo = (players: FullPlayerData[]) => {
  return players.reduce((acc, player) => acc + (player.rating || 0), 0)
}

const CalculateWinRate = (players: FullPlayerData[]) => {
  const totalGames = players.reduce(
    (acc, player) => acc + (player.wins || 0) + (player.losses || 0),
    0
  )
  const totalWins = players.reduce((acc, player) => acc + (player.wins || 0), 0)
  return totalWins / totalGames
}

const matchType = (leftPlayerLength: number, rightPlayerLength: number) => {
  if (leftPlayerLength === 2 && rightPlayerLength === 2) {
    return "2v2"
  } else if (leftPlayerLength === 3 && rightPlayerLength === 3) {
    return "3v3"
  } else if (leftPlayerLength === 4 && rightPlayerLength === 4) {
    return "4v4"
  } else {
    return "mixed"
  }
}

const MapStatsGrid: React.FC<MapCardProps> = ({ gameData }) => {
  const { data, error, loading } = useContext(MapStatsContext)

  if (!gameData) return null
  if (loading || error) return null
  let left = 0
  let right = 0
  const latestPatchInfo = data.latestPatchInfo

  const leftFactionString = gameData.gameData.left.players
    .reduce((acc, player) => acc + (factionShortcuts[player.faction] || ""), "")
    .split("")
    .sort()
    .join("")

  const rightFactionString = gameData.gameData.right.players
    .reduce((acc, player) => acc + (factionShortcuts[player.faction] || ""), "")
    .split("")
    .sort()
    .join("")

  const matchup = matchType(
    gameData.gameData.left.players.length,
    gameData.gameData.right.players.length
  )

  let factionMatrixString = ""

  if (gameData.gameData.left.side === "Axis") {
    factionMatrixString = `${leftFactionString}x${rightFactionString}`
  } else if (gameData.gameData.left.side === "Allies") {
    factionMatrixString = `${rightFactionString}x${leftFactionString}`
  } else {
    events.map_stats(matchup, gameData.gameData.map, factionMatrixString, false)
    console.log("Mixed matchup not supported")
    return null
  }

  if (matchup === "mixed") {
    left = 0
    right = 0
  } else {
    if (!data.mapStats.analysis[matchup][gameData.gameData.map]) {
      console.log(`Map stats not found for map ${gameData.gameData.map}`)

      events.map_stats(
        matchup,
        gameData.gameData.map,
        factionMatrixString,
        false
      )

      return null
    }
    const wins =
      data.mapStats.analysis[matchup][gameData.gameData.map]?.factionMatrix[
        factionMatrixString
      ]?.wins || 0
    const losses =
      data.mapStats.analysis[matchup][gameData.gameData.map]?.factionMatrix[
        factionMatrixString
      ]?.losses || 0

    if (gameData.gameData.left.side === "Axis") {
      left = wins / (wins + losses)
      right = losses / (wins + losses)
    } else {
      left = losses / (wins + losses)
      right = wins / (wins + losses)
    }

    events.map_stats(matchup, gameData.gameData.map, factionMatrixString, true)
  }

  return (
    <>
      <Grid>
        <Grid.Col span={4}>
          <Text c={left >= 0.5 ? "green" : "red"} ta={"right"}>
            {(left * 100).toFixed(1)}
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text fw={700} ta={"center"}>
            Map WinRate Composition
            <HoverCard width={300} shadow="md">
              <HoverCard.Target>
                <IconInfoCircle size={20} />
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <Text>
                  Based on team composition {factionMatrixString}.
                  <br />
                  Map game analysis from patch
                  <br /> {latestPatchInfo.group} -{" "}
                  <span style={{ whiteSpace: "nowrap" }}>
                    v{latestPatchInfo.label}
                  </span>
                  <br />
                  <Anchor
                    inherit
                    onClick={() => openLink(config.COH3STATS_STATS_MAPS)}
                  >
                    https://coh3stats.com/stats/maps
                  </Anchor>
                </Text>
              </HoverCard.Dropdown>
            </HoverCard>
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text c={right >= 0.5 ? "green" : "red"} ta={"left"}>
            {(right * 100).toFixed(1)} %
          </Text>
        </Grid.Col>
      </Grid>
    </>
  )
}

class CompositionErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Log the error or send it to an error reporting service
    console.error(error, errorInfo)
    // Update state to show the fallback UI
    this.setState({ hasError: true })
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <div>Error fetching map stats. Please report on discord.</div>
    }

    // @ts-ignore
    return this.props.children
  }
}

const SummaryCard: React.FC<MapCardProps> = ({ gameData }) => {
  if (!gameData) return null
  const localGameData = gameData.gameData

  const totalEloLeft = TotalElo(localGameData.left.players)
  const totalEloRight = TotalElo(localGameData.right.players)
  const biggerTotalEloLeft = totalEloLeft > totalEloRight

  const averageEloLeft = totalEloLeft / localGameData.left.players.length
  const averageEloRight = totalEloRight / localGameData.right.players.length
  const biggerAverageEloLeft = averageEloLeft > averageEloRight

  const averageWinRateLeft = CalculateWinRate(localGameData.left.players)
  const averageWinRateRight = CalculateWinRate(localGameData.right.players)

  return (
    <Paper p={"xs"}>
      <Grid key={"faction-grid"}>
        <Grid.Col span={5}>
          <Flex justify={"right"} gap={"5"}>
            {localGameData.left.players.map((player, index) => (
              <Image
                src={"/factions/" + player.faction + ".webp"}
                alt={player.faction}
                w={35}
                key={player.relicID + "_" + index}
              />
            ))}
          </Flex>
        </Grid.Col>
        <Grid.Col span={2}>
          <Flex justify={"center"}>
            <IconSwords size={35} />
          </Flex>
        </Grid.Col>
        <Grid.Col span={5}>
          <Flex justify={"left"} gap={"5"}>
            {localGameData.right.players.map((player, index) => (
              <Image
                src={"/factions/" + player.faction + ".webp"}
                alt={player.faction}
                w={35}
                key={player.relicID + "_" + index}
              />
            ))}
          </Flex>
        </Grid.Col>
      </Grid>
      <Divider my="md" m={"xs"} />
      <Grid key={"elo-grid"}>
        <Grid.Col span={4}>
          <Text c={biggerTotalEloLeft ? "green" : "red"} ta={"right"}>
            {totalEloLeft}
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text fw={700} ta={"center"}>
            Total ELO
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text c={biggerTotalEloLeft ? "red" : "green"}>{totalEloRight}</Text>
        </Grid.Col>
      </Grid>
      <Divider my="xs" m={"xs"} />
      <Grid key={"average-elo-grid"}>
        <Grid.Col span={4}>
          <Text c={biggerAverageEloLeft ? "green" : "red"} ta={"right"}>
            {averageEloLeft.toFixed(0)}
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text fw={700} ta={"center"}>
            Average ELO
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text c={biggerAverageEloLeft ? "red" : "green"} ta={"left"}>
            {averageEloRight.toFixed(0)}
          </Text>
        </Grid.Col>
      </Grid>
      <Divider my="xs" m={"xs"} />
      <Grid key={"win-rate-grid"}>
        <Grid.Col span={4}>
          <Text c={averageWinRateLeft >= 0.5 ? "green" : "red"} ta={"right"}>
            {(averageWinRateLeft * 100).toFixed(1)} %
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text fw={700} ta={"center"}>
            Average WinRate
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text c={averageWinRateRight >= 0.5 ? "green" : "red"} ta={"left"}>
            {(averageWinRateRight * 100).toFixed(1)} %
          </Text>
        </Grid.Col>
      </Grid>
      <Divider my="xs" m={"xs"} />
      <CompositionErrorBoundary>
        <MapStatsGrid gameData={gameData} />
      </CompositionErrorBoundary>
    </Paper>
  )
}

export default SummaryCard
