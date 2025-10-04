import React from "react";
import { Badge, Group, Loader, Image, Tooltip } from "@mantine/core";
import { useGameData } from "../game-data-provider/GameDataProvider";

interface GameStateProps {
  compact?: boolean;
}

export const GameState: React.FC<GameStateProps> = ({ compact = false }) => {
  const gameData = useGameData();

  return (
    <Tooltip
      label="Current game state - shows whether you are in menu, loading, or in-game"
      multiline
      w={250}
      withArrow
    >
      <div>
        <Group gap={"xs"}>
          <Image
            src="/icons/coh3-icon.webp"
            alt="Game State"
            w={compact ? 18 : 24}
            h={compact ? 18 : 24}
            radius={"md"}
          />
          {gameData ? (
            <Badge
              variant="filled"
              size={"md"}
              style={{
                minWidth: 60,
                marginBottom: compact ? 0 : -1,
              }}
            >
              {gameData.gameData.state}
            </Badge>
          ) : (
            <Loader type="dots" size="md" style={{ minWidth: 60 }} />
          )}
        </Group>
      </div>
    </Tooltip>
  );
};
