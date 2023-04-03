import {
  Anchor,
  ColorSwatch,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Image,
  Tooltip,
  Grid,
  Col,
} from "@mantine/core"
import React from "react"
import { FullPlayerData } from "../game-data-provider/GameData"
import { PlayerELO } from "./PlayerELO"
import { PlayerLosses } from "./PlayerLosses"
import { PlayerRank } from "./PlayerRank"
import { PlayerStreak } from "./PlayerStreak"
import { PlayerWinRatio } from "./PlayerWinRatio"
import { PlayerWins } from "./PlayerWins"
import { open } from "@tauri-apps/api/shell"

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
  return (
    <>
      <Paper shadow="xs" withBorder p="xs" mb={"xs"}>
        <Grid>
          <Col span="content">
            <Tooltip label={faction}>
              <Image
                src={"/factions/" + faction + ".webp"}
                alt={faction}
                width={60}
              />
            </Tooltip>
          </Col>
          <Col span="auto">
            <Stack align="stretch">
              <Group>
                {!ai ? (
                  <Image
                    src={"/flags/4x3/" + country + ".svg"}
                    alt={country}
                    width={35}
                  />
                ) : null}

                <Title
                  size="h3"
                  onClick={() =>
                    open("https://coh3stats.com/players/" + relicID)
                  }
                >
                  <Anchor>{name}</Anchor> {self ? <>(You)</> : null}
                </Title>
                {/*<ColorSwatch color={color} />*/}
              </Group>

              <Group position="apart" grow>
                <PlayerRank rank={rank} />
                <PlayerELO rating={!rank || rank < 1 ? undefined : rating} />
                <PlayerStreak streak={streak} />
                <PlayerWinRatio wins={wins} losses={losses} />
                <PlayerWins wins={wins} />
                <PlayerLosses losses={losses} />
              </Group>
            </Stack>
          </Col>
        </Grid>
      </Paper>
    </>
  )
}
