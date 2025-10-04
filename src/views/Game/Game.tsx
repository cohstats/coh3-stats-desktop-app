import { useGameData } from "../../game-data-provider/GameDataProvider";
import { Title, Grid, Loader, Stack, Group } from "@mantine/core";
import { PlayerCard } from "./components/PlayerCard";
import { useLogFilePath } from "../../game-data-provider/configValues";

import MapCard from "./components/MapCard";
import { IconSwords } from "@tabler/icons-react";
import SummaryCard from "./components/SummaryCard";
import { ArrangedTeamCard } from "./components/arranged-team-card";
import React, { memo } from "react";
import { GameDataTypes } from "../../game-data-provider/GameData-types";

const GameContent = memo(
  ({
    gameData,
    logFilePath,
  }: {
    gameData: GameDataTypes;
    logFilePath: string | undefined | any;
  }) => {
    return (
      <>
        {logFilePath !== undefined ? (
          <>
            {gameData && gameData.gameData.map.length > 0 ? (
              <>
                <Grid gutter={0} p={"md"} pt={0}>
                  <Grid.Col span="auto" pt={10}>
                    {gameData.gameData.left.players.map((player, index) => (
                      <PlayerCard key={player.relicID + " " + index} {...player} />
                    ))}
                    <ArrangedTeamCard
                      players={gameData.gameData.left.players}
                      side={gameData.gameData.left.side}
                    />
                  </Grid.Col>
                  <Grid.Col span="content" mx={"sm"} pt={30}>
                    <IconSwords size={55} />
                  </Grid.Col>
                  <Grid.Col span="auto" pt={10}>
                    {gameData.gameData.right.players.map((player, index) => (
                      <PlayerCard key={player.relicID + " " + index} {...player} />
                    ))}
                    <ArrangedTeamCard
                      players={gameData.gameData.right.players}
                      side={gameData.gameData.right.side}
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
