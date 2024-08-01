import {
  Anchor,
  Group,
  Paper,
  Stack,
  Title,
  Image,
  Tooltip,
  Grid,
} from "@mantine/core"
import React from "react"
import { FullPlayerData } from "../game-data-provider/GameData-types"
import { PlayerELO } from "./PlayerELO"
import { PlayerLosses } from "./PlayerLosses"
import { PlayerRank } from "./PlayerRank"
import { PlayerStreak } from "./PlayerStreak"
import { PlayerWinRatio } from "./PlayerWinRatio"
import { PlayerWins } from "./PlayerWins"
import { open } from "@tauri-apps/api/shell"
import { getFactionName, getCountryName } from "../utils/renameLabels"
import RankIcon from "./other/rank-icon"
import { coh3statsPlayerProfile } from "../utils/external-routes"

export interface PlayerCardProps extends FullPlayerData {}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  rank,
  relicID,
  name,
  faction,
  rating,
  streak,
  wins,
  losses,
  country,
  color,
  ai,
  self,
}) => {
  const factionName = getFactionName(faction)
  const countryName = country ? getCountryName(country) : ""

  return (
    <>
      <Paper shadow="xs" withBorder p="xs" mb={"xs"}>
        <Grid>
          <Grid.Col span="content">
            <Tooltip label={factionName}>
              <Image
                src={"/factions/" + faction + ".webp"}
                alt={faction}
                w={60}
              />
            </Tooltip>
          </Grid.Col>
          <Grid.Col span="auto">
            <Stack align="stretch" gap={"xs"}>
              <Group justify={"space-between"}>
                <Group>
                  {!ai ? (
                    <Tooltip label={countryName}>
                      <Image
                        src={"/flags/4x3/" + country + ".svg"}
                        alt={country}
                        w={30}
                      />
                    </Tooltip>
                  ) : null}

                  <Title
                    size="h3"
                    onClick={() => open(coh3statsPlayerProfile(relicID))}
                  >
                    <Anchor inherit>{name}</Anchor> {self ? <>(You)</> : null}
                  </Title>
                  {/*<Grid.ColorSwatch color={color} />*/}
                </Group>
                <RankIcon size={35} rank={rank || 0} rating={rating || 0} />
              </Group>

              <Group justify="space-between" grow>
                <PlayerRank rank={rank} />
                <PlayerELO rating={!rank || rank < 1 ? undefined : rating} />

                <PlayerStreak streak={streak} />
                <PlayerWinRatio wins={wins} losses={losses} />
                <PlayerWins wins={wins} />
                <PlayerLosses losses={losses} />
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>
    </>
  )
}
