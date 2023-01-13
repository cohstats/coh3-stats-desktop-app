import React, { useCallback, useContext, useEffect, useRef } from "react"
import { GameData, RawGameData } from "./GameData"
import { useRawGameData } from "./useRawGameData"

const GameDataContext = React.createContext<GameData>({ logFileFound: false })
export const useGameData = () => useContext(GameDataContext)

export interface GameDataProviderProps {
    children?: React.ReactNode
}

export const GameDataProvider: React.FC<GameDataProviderProps> = ({
    children,
}) => {
    const { logFileFound, rawGameData } = useRawGameData()
    const lastGameUniqueKeyRef = useRef<string>("")
    console.log("rawprovider", rawGameData)
    const generateGameUniqueKey = useCallback((rawGameData: RawGameData) => {
        return (
            rawGameData.timestamp +
            rawGameData.map +
            rawGameData.win_condition +
            rawGameData.left.players
                .concat(rawGameData.right.players)
                .map((player) => player.relic_id)
                .join()
        )
    }, [])
    useEffect(() => {
        if (
            logFileFound &&
            rawGameData &&
            lastGameUniqueKeyRef.current !== generateGameUniqueKey(rawGameData)
        ) {
            // refine log file data
            console.log("Refine log file data")
        }
    }, [logFileFound, rawGameData])
    return (
        <>
            <GameDataContext.Provider
                value={
                    logFileFound && rawGameData
                        ? { logFileFound: true, rawGameData }
                        : { logFileFound: false }
                }
            >
                {children}
            </GameDataContext.Provider>
        </>
    )
}
