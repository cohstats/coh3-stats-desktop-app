import { Anchor, Group, Paper, Stack, Title, Image, Tooltip, Grid, Text } from "@mantine/core";
import React from "react";
import { FullPlayerData } from "../game-data-provider/GameData-types";
import { PlayerELO } from "./PlayerELO";
import { PlayerLosses } from "./PlayerLosses";
import { PlayerRank } from "./PlayerRank";
import { PlayerStreak } from "./PlayerStreak";
import { PlayerWinRatio } from "./PlayerWinRatio";
import { PlayerWins } from "./PlayerWins";
import { open } from "@tauri-apps/api/shell";
import { getFactionName, getCountryName } from "../utils/renameLabels";
import RankIcon from "./other/rank-icon";
import { coh3statsPlayerProfile } from "../utils/external-routes";
import EllipsisText from "./other/ellipsis-text";
import { useShowExtendedPlayerInfo } from "../game-data-provider/configValues";

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
  factionStats,
  totalGames,
}) => {
  const factionName = getFactionName(faction);
  const countryName = country ? getCountryName(country) : "";
  const [showExtendedPlayerInfo, setShowExtendedPlayerInfo] = useShowExtendedPlayerInfo();

  const extendedInfo = showExtendedPlayerInfo ? (
    <>
      <Text size="sm" c={"dimmed"} style={{ textAlign: "center" }}>
        <Tooltip label={factionName}>
          <span>
            {factionStats?.bestRank && (
              <>
                Rank <b>{factionStats?.bestRank}</b> in {factionStats?.inMode} |{" "}
              </>
            )}
            WR{" "}
            <b>
              {(
                ((factionStats?.factionWins || 0) /
                  ((factionStats?.factionWins || 0) + (factionStats?.factionLosses || 0))) *
                100
              ).toFixed(0)}
              %
            </b>{" "}
            in <b>{(factionStats?.factionWins || 0) + (factionStats?.factionLosses || 0)}</b>{" "}
            games |{" "}
          </span>
        </Tooltip>
        Total WR{" "}
        <b>
          {(
            ((totalGames?.totalWins || 0) /
              ((totalGames?.totalWins || 0) + (totalGames?.totalLosses || 0))) *
            100
          ).toFixed(0)}
          %
        </b>{" "}
        in <b>{(totalGames?.totalWins || 0) + (totalGames?.totalLosses || 0)}</b> games
      </Text>
    </>
  ) : (
    <></>
  );

  return (
    <>
      <Paper shadow="xs" withBorder p="xs" mb={"xs"}>
        <Grid>
          <Grid.Col span="content">
            <Tooltip label={factionName}>
              <Image src={"/factions/" + faction + ".webp"} alt={faction} w={62} />
            </Tooltip>
          </Grid.Col>
          <Grid.Col span="auto">
            <Stack align="stretch" gap={4}>
              <Group justify={"space-between"}>
                <Group>
                  {!ai ? (
                    <Tooltip label={countryName}>
                      <Image src={"/flags/4x3/" + country + ".svg"} alt={country} w={30} />
                    </Tooltip>
                  ) : null}
                  <Group gap={4}>
                    <Title size="h3" onClick={() => open(coh3statsPlayerProfile(relicID))}>
                      <Anchor inherit>
                        <EllipsisText text={name} maxWidth={"19ch"} />
                      </Anchor>
                    </Title>
                    <Text size="xl" c="dimmed">
                      {self ? <> ( You )</> : null}
                    </Text>
                  </Group>
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
        <div>{extendedInfo}</div>
      </Paper>
    </>
  );
};
