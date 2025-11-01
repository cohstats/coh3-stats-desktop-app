import { useGameData } from "../../game-data-provider/GameDataProvider";
import { Title, Grid, Loader, Stack, Group } from "@mantine/core";
import { PlayerCard } from "./components/PlayerCard";
import { useLogFilePath } from "../../game-data-provider/configValues";

import MapCard from "./components/MapCard";
import { IconSwords } from "@tabler/icons-react";
import SummaryCard from "./components/SummaryCard";
import { ArrangedTeamCard } from "./components/arranged-team-card";
import React, { memo, useState } from "react";
import { GameDataTypes } from "../../game-data-provider/GameData-types";
import { KnownFriendsGroup } from "../../utils/team-grouping";

const GameContent = memo(
  ({
    gameData,
    logFilePath,
  }: {
    gameData: GameDataTypes;
    logFilePath: string | undefined | any;
  }) => {
    const [leftTeamGroups, setLeftTeamGroups] = useState<KnownFriendsGroup[]>([]);
    const [rightTeamGroups, setRightTeamGroups] = useState<KnownFriendsGroup[]>([]);

    // Helper function to get team color for a player
    const getPlayerTeamColor = (
      relicID: string,
      teamGroups: KnownFriendsGroup[],
    ): string | undefined => {
      const playerId = parseInt(relicID, 10);
      if (isNaN(playerId)) return undefined;

      const group = teamGroups.find((g) => g.playerIds.includes(playerId));
      return group?.color;
    };

    return (
      <>
        {logFilePath !== undefined ? (
          <>
            {gameData && gameData.gameData.map.length > 0 ? (
              <>
                <Grid gutter={0} p={"md"} pt={0}>
                  <Grid.Col span="auto" pt={10}>
                    {gameData.gameData.left.players.map((player, index) => (
                      <PlayerCard
                        key={player.relicID + " " + index}
                        {...player}
                        teamColor={getPlayerTeamColor(player.relicID, leftTeamGroups)}
                      />
                    ))}
                    <ArrangedTeamCard
                      players={gameData.gameData.left.players}
                      side={gameData.gameData.left.side}
                      onTeamGroupsChange={setLeftTeamGroups}
                    />
                  </Grid.Col>
                  <Grid.Col span="content" mx={"sm"} pt={30}>
                    <IconSwords size={55} />
                  </Grid.Col>
                  <Grid.Col span="auto" pt={10}>
                    {gameData.gameData.right.players.map((player, index) => (
                      <PlayerCard
                        key={player.relicID + " " + index}
                        {...player}
                        teamColor={getPlayerTeamColor(player.relicID, rightTeamGroups)}
                      />
                    ))}
                    <ArrangedTeamCard
                      players={gameData.gameData.right.players}
                      side={gameData.gameData.right.side}
                      onTeamGroupsChange={setRightTeamGroups}
                    />
                  </Grid.Col>
                </Grid>
                <Grid gutter={0} p={"md"} pt={0}>
                  <Grid.Col span={6} pr={"xl"}>
                    <MapCard gameData={gameData} />
                  </Grid.Col>
                  <Grid.Col span={6} pl={"xl"}>
                    <SummaryCard gameData={gameData} />
                  </Grid.Col>
                </Grid>
              </>
            ) : (
              <Stack mt={50} align="center" justify="center" gap={"xl"}>
                <Title>Waiting for a game</Title>
                <Loader mr="md" />
              </Stack>
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
    );
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  },
);

export const Game: React.FC = () => {
  const gameData = useGameData();
  const [logFilePath] = useLogFilePath();

  return <GameContent gameData={gameData} logFilePath={logFilePath} />;
};
