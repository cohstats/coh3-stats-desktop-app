import axios from "axios"
import React, { useCallback, useContext, useEffect, useRef } from "react"
import { GameData, RawGameData } from "./GameData"
import { useRawGameData } from "./useRawGameData"

const BASE_RELIC_API_URL = "https://coh3-api.reliclink.com"

const GameDataContext = React.createContext<GameData>({ logFileFound: false })
export const useGameData = () => useContext(GameDataContext)

export interface GameDataProviderProps {
    children?: React.ReactNode
}

export const GameDataProvider: React.FC<GameDataProviderProps> = ({
    children,
}) => {
    const { logFilePath, rawGameData } = useRawGameData()
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
        const fetchLeaderboardStats = async (rawGameData: RawGameData) => {
            const requestURL =
                BASE_RELIC_API_URL +
                "/community/leaderboard/getpersonalstat?profile_ids=[" +
                rawGameData.left.players
                    .concat(rawGameData.right.players)
                    .map((player) => player.relic_id)
                    .filter((relic_id) => relic_id !== "-1") // remove ai -1 relic ids
                    .filter((element, index, array) => {
                        // remove redundant relic ids
                        return array.indexOf(element) === index
                    })
                    .join(",") +
                "]&title=coh3"
            console.log(requestURL)
            try {
                const response = await fetch(requestURL, {
                    mode: "no-cors",
                    method: "GET",
                })
                console.log(response)
                const text = await response.text()
                console.log(text)
                const data = await response.json()
                console.log(data)
            } catch (e: any) {
                console.error(e)
            }
        }
        if (
            logFilePath !== undefined &&
            rawGameData &&
            lastGameUniqueKeyRef.current !== generateGameUniqueKey(rawGameData)
        ) {
            // refine log file data
            console.log("Refine log file data")
            fetchLeaderboardStats(rawGameData)
        }
    }, [logFilePath, rawGameData])
    return (
        <>
            <GameDataContext.Provider
                value={
                    logFilePath !== undefined && rawGameData
                        ? { logFileFound: true, rawGameData }
                        : { logFileFound: false }
                }
            >
                {children}
            </GameDataContext.Provider>
        </>
    )
}
