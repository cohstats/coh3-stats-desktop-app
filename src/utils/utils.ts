import { MapViewSettings } from "../game-data-provider/GameData-types"
import { PlayerRanks } from "./coh3-data"
import config from "../config"
import { MapStatsDataType } from "./data-types"
import {
  leaderboardsIDAsObject,
  raceType,
  RawLaddersObject,
} from "coh3-data-types-library"

export const calculatePlayerTier = (rank: number, rating: number) => {
  if (!rank || rank <= 0) {
    return PlayerRanks.NO_RANK
  }

  if (rating < 1600) {
    const playerRank = Object.values(PlayerRanks).find(
      (x) => x.min <= rating && rating <= x.max
    )

    return playerRank || PlayerRanks.NO_RANK
  }

  // If rating is higher than 1600, take into account the rank.
  if (rating >= 1600) {
    // GOLD_1 is exception
    if (rank > 50) {
      return PlayerRanks.GOLD_1
    }

    // Create a sorted array of PlayerRanks entries
    const sortedPlayerRanks = Object.entries(PlayerRanks).sort(
      ([, rankInfoA], [, rankInfoB]) => rankInfoA.rank - rankInfoB.rank
    )

    let rankKey = "CHALLENGER_5"

    for (const [key, rankInfo] of sortedPlayerRanks) {
      if (rank <= rankInfo.rank) {
        rankKey = key
        break
      }
    }

    return PlayerRanks[rankKey]
  }

  return PlayerRanks.NO_RANK
}

export const getMapName = (mapCode: string, data: MapStatsDataType | null) => {
  if (!data) {
    return mapCode
  }

  return data.mapInfo[mapCode].name || mapCode
}

export const getMapsUrlOnCDN = (mapName: string, mapType?: MapViewSettings) => {
  switch (mapType) {
    case "tm":
      return `${config.CDN_ASSETS_HOSTING}/maps/${mapName}/${mapName}.marked.tm.webp`
    case "colored":
      return `${config.CDN_ASSETS_HOSTING}/maps/${mapName}/${mapName}.marked.colored.webp`
    case "default":
      return `${config.CDN_ASSETS_HOSTING}/maps/${mapName}/${mapName}.marked.webp`
    case "none":
    default:
      return `${config.CDN_ASSETS_HOSTING}/maps/${mapName}/${mapName}.webp`
  }
}

export const calculatePlayerPlayedFactionStats = (
  leaderBoardsAsObject: Record<string, RawLaddersObject["leaderboardStats"][0]>,
  faction: raceType
) => {
  const result: {
    bestRank: number | null
    inMode: string | null
    factionWins: number
    factionLosses: number
  } = {
    bestRank: Infinity,
    inMode: null,
    factionWins: 0,
    factionLosses: 0,
  }

  for (const mode of ["1v1", "2v2", "3v3", "4v4"] as const) {
    const leaderboard =
      leaderBoardsAsObject[leaderboardsIDAsObject[mode][faction]]
    if (leaderboard) {
      // Update best rank
      if (
        leaderboard.rank &&
        leaderboard.rank !== -1 &&
        (result.bestRank === null || leaderboard.rank < result.bestRank)
      ) {
        result.bestRank = leaderboard.rank
        result.inMode = mode
      }

      // Sum wins and losses
      result.factionWins += leaderboard.wins || 0
      result.factionLosses += leaderboard.losses || 0
    }
  }

  // If no rank was found, set bestRank to null
  if (result.bestRank === Infinity) {
    result.bestRank = null
  }

  return result
}

export const calculateTotalGamesForPlayer = (
  leaderBoardsAsObject: Record<string, RawLaddersObject["leaderboardStats"][0]>
) => {
  const results = {
    totalWins: 0,
    totalLosses: 0,
  }
  for (const mode of ["1v1", "2v2", "3v3", "4v4"] as const) {
    for (const faction of ["american", "british", "german", "dak"] as const) {
      const leaderboard =
        leaderBoardsAsObject[leaderboardsIDAsObject[mode][faction]]
      if (leaderboard) {
        results.totalWins += leaderboard.wins || 0
        results.totalLosses += leaderboard.losses || 0
      }
    }
  }

  return results
}
