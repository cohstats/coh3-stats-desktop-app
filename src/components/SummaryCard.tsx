import {
  FullPlayerData,
  GameData,
  MapViewSettings,
} from "../game-data-provider/GameData"
import { useMapViewSettings } from "../game-data-provider/configValues"
import { Card, Divider, Flex, Grid, Image, Paper, Text } from "@mantine/core"
import { getMapName, getMapsUrlOnCDN } from "../utils/utils"
import { IconSwords } from "@tabler/icons-react"
import { PlayerCard } from "./PlayerCard"
import React from "react"
import { getFactionName } from "../utils/renameLabels"

interface MapCardProps {
  gameData: GameData
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
      <Grid>
        <Grid.Col span={5}>
          <Flex justify={"right"} gap={"5"}>
            {localGameData.left.players.map((player, index) => (
              <Image
                src={"/factions/" + player.faction + ".webp"}
                alt={player.faction}
                w={35}
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
              />
            ))}
          </Flex>
        </Grid.Col>
      </Grid>
      <Divider my="md" m={"xs"} />
      <Grid>
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
      <Divider my="md" m={"xs"} />
      <Grid>
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
      <Divider my="md" m={"xs"} />
      <Grid>
        <Grid.Col span={4}>
          <Text c={averageWinRateLeft >= 0.5 ? "green" : "red"} ta={"right"}>
            {(averageWinRateLeft * 100).toFixed(1)} %
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text fw={700} ta={"center"}>
            Average Team WinRate
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text c={averageWinRateRight >= 0.5 ? "green" : "red"} ta={"left"}>
            {(averageWinRateRight * 100).toFixed(1)} %
          </Text>
        </Grid.Col>
      </Grid>
      <Divider my="md" m={"xs"} />
    </Paper>
  )
}

export default SummaryCard
