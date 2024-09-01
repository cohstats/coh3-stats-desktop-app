import React, { useContext } from "react"
import { useLogFilePath } from "./configValues"
import { GameDataTypes } from "./GameData-types"
import { useFullGameData } from "./useFullGameData"

const GameDataContext = React.createContext<GameDataTypes>(undefined)
export const useGameData = () => useContext(GameDataContext)

export interface GameDataProviderProps {
  children?: React.ReactNode
}

// TODO: This is being triggered every 4s causing re-renders
// TODO: We need to fix this https://github.com/cohstats/coh3-stats-desktop-app/issues/156
// The 4 seconds make sense, as the log file is being watched for changes
// But we should not get the change when it's still the same
export const GameDataProvider: React.FC<GameDataProviderProps> = ({
  children,
}) => {
  const { gameData, reloadLogFile } = useFullGameData()
  const [logFilePath] = useLogFilePath()

  return (
    <>
      <GameDataContext.Provider
        value={
          logFilePath !== undefined && gameData
            ? {
                gameData,
                reloadLogFile,
              }
            : undefined
        }
      >
        {children}
      </GameDataContext.Provider>
    </>
  )
}
