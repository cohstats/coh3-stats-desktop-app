import axios from "axios"
import React, { useCallback, useContext, useEffect, useRef } from "react"
import { http } from "@tauri-apps/api"
import { GameData, RawGameData } from "./GameData"
import { useRawGameData } from "./useRawGameData"
import { useFullGameData } from "./useFullGameData"

const BASE_RELIC_API_URL = "https://coh3-api.reliclink.com"

const GameDataContext = React.createContext<GameData>({ logFileFound: false })
export const useGameData = () => useContext(GameDataContext)

export interface GameDataProviderProps {
    children?: React.ReactNode
}

export const GameDataProvider: React.FC<GameDataProviderProps> = ({
    children,
}) => {
    const { logFilePath, gameData } = useFullGameData()
    return (
        <>
            <GameDataContext.Provider
                value={
                    logFilePath !== undefined && gameData
                        ? { logFileFound: true, gameData }
                        : { logFileFound: false }
                }
            >
                {children}
            </GameDataContext.Provider>
        </>
    )
}
