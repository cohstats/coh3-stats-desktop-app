import { useCallback, useEffect, useRef, useState } from "react"
import { RawLaddersObject } from "coh3-data-types-library"
import {
    FullGameData,
    FullPlayerData,
    GameState,
    GameType,
    RawGameData,
    RawTeamData,
    TeamSide,
} from "./GameData"
import { useRawGameData } from "./useRawGameData"
import { fetch } from "@tauri-apps/api/http"
import {
    BASE_RELIC_API_URL,
    leaderboardsIDAsObject,
    leaderBoardType,
    logFileRaceTypeToRaceType,
} from "coh3-data-types-library"
import { MantineColor } from "@mantine/core"

const PLAYER_COLOR_OBJECT: { left: MantineColor[]; right: MantineColor[] } = {
    left: ["blue", "blue", "blue", "blue"],
    right: ["pink", "green", "red", "purple"],
}

export const useFullGameData = () => {
    const {
        logFilePath,
        rawGameData,
        setInterval,
        setLogFilePath,
        interval,
        logFileFound,
        reloadLogFile,
    } = useRawGameData()
    const lastGameUniqueKeyRef = useRef<string>("")
    const [gameData, setGameData] = useState<FullGameData>()

    const generateUniqueGameKey = useCallback((rawGameData: RawGameData) => {
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
        const refineSide = async (side: RawTeamData, left: boolean) => {
            const gameMode = (side.players.length +
                "v" +
                side.players.length) as leaderBoardType
            const onlyRealPlayers = side.players.filter((player) => !player.ai)
            let responses = await Promise.all(
                onlyRealPlayers.map((player) =>
                    fetch(
                        BASE_RELIC_API_URL +
                            "/community/leaderboard/getpersonalstat?profile_ids=[" +
                            player.relic_id +
                            "]&title=coh3",
                        {
                            method: "GET",
                        }
                    )
                )
            )
            let mergedResponses = responses.map((response, index) => ({
                response,
                relicID: onlyRealPlayers[index].relic_id,
                faction:
                    logFileRaceTypeToRaceType[onlyRealPlayers[index].faction],
            }))
            let refinedPlayerData = side.players.map(
                (player, index): FullPlayerData => ({
                    ai: player.ai,
                    faction: logFileRaceTypeToRaceType[player.faction],
                    relicID: player.relic_id,
                    name: player.name,
                    position: player.position,
                    color: left
                        ? PLAYER_COLOR_OBJECT.left[index]
                        : PLAYER_COLOR_OBJECT.right[index],
                })
            )
            mergedResponses.forEach((response) => {
                const data = response.response.data as RawLaddersObject
                if (data.result && data.result.message === "SUCCESS") {
                    const refinedPlayerIndex = refinedPlayerData.findIndex(
                        (player) => player.relicID === response.relicID
                    )
                    if (refinedPlayerIndex === -1) {
                        return
                    }
                    const member = data.statGroups[0].members.find(
                        (member) => member.profile_id + "" === response.relicID
                    )
                    if (member) {
                        refinedPlayerData[refinedPlayerIndex].country =
                            member.country
                        refinedPlayerData[refinedPlayerIndex].steamID =
                            member.name.split("/").at(-1)
                        refinedPlayerData[refinedPlayerIndex].level =
                            member.level
                        refinedPlayerData[refinedPlayerIndex].xp = member.xp
                    }
                    console.log(gameMode)
                    console.log(response.faction)
                    const leaderboardID =
                        leaderboardsIDAsObject[gameMode][response.faction]
                    console.log(leaderboardID)
                    const leaderboard = data.leaderboardStats.find(
                        (leaderboard) =>
                            leaderboard.leaderboard_id === leaderboardID
                    )
                    if (leaderboard) {
                        refinedPlayerData[refinedPlayerIndex].disputes =
                            leaderboard.disputes
                        refinedPlayerData[refinedPlayerIndex].drops =
                            leaderboard.drops
                        refinedPlayerData[refinedPlayerIndex].lastMatchDate =
                            leaderboard.lastmatchdate
                        refinedPlayerData[refinedPlayerIndex].losses =
                            leaderboard.losses
                        refinedPlayerData[refinedPlayerIndex].rank =
                            leaderboard.rank
                        refinedPlayerData[refinedPlayerIndex].rankLevel =
                            leaderboard.ranklevel
                        refinedPlayerData[refinedPlayerIndex].rankTotal =
                            leaderboard.ranktotal
                        refinedPlayerData[refinedPlayerIndex].rating =
                            leaderboard.rating
                        refinedPlayerData[refinedPlayerIndex].regionRank =
                            leaderboard.regionrank
                        refinedPlayerData[refinedPlayerIndex].regionRankTotal =
                            leaderboard.regionranktotal
                        refinedPlayerData[refinedPlayerIndex].streak =
                            leaderboard.streak
                        refinedPlayerData[refinedPlayerIndex].wins =
                            leaderboard.wins
                    }
                }
            })
            return refinedPlayerData
        }
        const refineLogFileData = async (rawGameData: RawGameData) => {
            try {
                const [leftRefined, rightRefined] = await Promise.all([
                    refineSide(rawGameData.left, true),
                    refineSide(rawGameData.right, false),
                ])
                setGameData({
                    uniqueID: generateUniqueGameKey(rawGameData),
                    state: rawGameData.game_state,
                    type: rawGameData.game_type,
                    timestamp: rawGameData.timestamp,
                    duration: rawGameData.duration,
                    map: rawGameData.map,
                    winCondition: rawGameData.win_condition,
                    left: {
                        side: rawGameData.left.side,
                        players: leftRefined,
                    },
                    right: {
                        side: rawGameData.right.side,
                        players: rightRefined,
                    },
                })
                console.log("done")
            } catch (e: any) {
                console.error(e)
            }
        }
        if (
            logFileFound &&
            rawGameData &&
            lastGameUniqueKeyRef.current !== generateUniqueGameKey(rawGameData)
        ) {
            console.log("Refine log file data")
            console.log(rawGameData)
            refineLogFileData(rawGameData)
            lastGameUniqueKeyRef.current = generateUniqueGameKey(rawGameData)
        }
    }, [logFilePath, rawGameData])

    return {
        setInterval,
        setLogFilePath,
        interval,
        logFilePath,
        rawGameData,
        gameData,
        reloadLogFile,
    }
}
