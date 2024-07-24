import { MapViewSettings } from "../game-data-provider/GameData"
import { PlayerRanks, maps } from "./coh3-data"
import config from "../config"

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

export const getMapName = (map: string) => {
  return maps[map]?.name || map
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
