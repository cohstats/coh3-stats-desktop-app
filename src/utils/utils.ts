import {PlayerRanks} from "./coh3-data";

export const calculatePlayerTier = (rank: number, rating: number) => {
  if (!rank || rank <= 0) {
    return PlayerRanks.NO_RANK;
  }

  if (rating < 1600) {
    const playerRank = Object.values(PlayerRanks).find((x) => x.min <= rating && rating <= x.max);

    return playerRank || PlayerRanks.NO_RANK;
  }

  // If rating is higher than 1600, take into account the rank.
  if (rating >= 1600) {
    // GOLD_1 is exception
    if (rank > 50) {
      return PlayerRanks.GOLD_1;
    }

    // Create a sorted array of PlayerRanks entries
    const sortedPlayerRanks = Object.entries(PlayerRanks).sort(
      ([, rankInfoA], [, rankInfoB]) => rankInfoA.rank - rankInfoB.rank,
    );

    let rankKey = "CHALLENGER_5";

    for (const [key, rankInfo] of sortedPlayerRanks) {
      if (rank <= rankInfo.rank) {
        rankKey = key;
        break;
      }
    }

    return PlayerRanks[rankKey];
  }

  return PlayerRanks.NO_RANK;
};
