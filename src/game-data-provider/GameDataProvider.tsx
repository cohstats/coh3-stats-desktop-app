import React, { useContext, useMemo } from "react";
import { useLogFilePath } from "./configValues";
import { GameDataTypes } from "./GameData-types";
import { useFullGameData } from "./useFullGameData";
import { useAudioManager } from "../game-found/useAudioManager";

const GameDataContext = React.createContext<GameDataTypes>(undefined);
export const useGameData = () => useContext(GameDataContext);

export interface GameDataProviderProps {
  children?: React.ReactNode;
}

export const GameDataProvider: React.FC<GameDataProviderProps> = ({ children }) => {
  const { gameData, reloadLogFile } = useFullGameData();
  const [logFilePath] = useLogFilePath();

  // Initialize audio manager for auto-mute functionality
  useAudioManager(gameData);

  const contextValue = useMemo(() => {
    if (gameData) {
      return {
        gameData,
        reloadLogFile,
      };
    } else {
      return undefined;
    }
  }, [gameData, reloadLogFile]);

  return (
    <>
      <GameDataContext.Provider
        value={logFilePath !== undefined && gameData ? contextValue : undefined}
      >
        {children}
      </GameDataContext.Provider>
    </>
  );
};
