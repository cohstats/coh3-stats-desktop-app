import { ProcessedMatch } from "./data-types";
import { raceID, raceType } from "../coh3-types";

// Match type mapping
export const matchTypesAsObject: Record<
  number,
  { id: number; name: string; localizedName: string }
> = {
  0: {
    id: 0,
    name: "Custom",
    localizedName: "Custom",
  },
  1: {
    id: 1,
    name: "1V1_Ranked",
    localizedName: "1 vs 1",
  },
  2: {
    id: 2,
    name: "2V2_Ranked",
    localizedName: "2 vs 2",
  },
  3: {
    id: 3,
    name: "3V3_Ranked",
    localizedName: "3 vs 3",
  },
  4: {
    id: 4,
    name: "4V4_Ranked",
    localizedName: "4 vs 4",
  },
  5: {
    id: 5,
    name: "2V2_Ai_Easy",
    localizedName: "2v2 AI Easy",
  },
  6: {
    id: 6,
    name: "2V2_Ai_Medium",
    localizedName: "2v2 AI Medium",
  },
  7: {
    id: 7,
    name: "2V2_Ai_Hard",
    localizedName: "2v2 AI Hard",
  },
  8: {
    id: 8,
    name: "2V2_Ai_Expert",
    localizedName: "2v2 AI Expert",
  },
  9: {
    id: 9,
    name: "3V3_Ai_Easy",
    localizedName: "3v3 AI Easy",
  },
  10: {
    id: 10,
    name: "3V3_Ai_Medium",
    localizedName: "3v3 AI Medium",
  },
  11: {
    id: 11,
    name: "3V3_Ai_Hard",
    localizedName: "3v3 AI Hard",
  },
  12: {
    id: 12,
    name: "3V3_Ai_Expert",
    localizedName: "3v3 AI Expert",
  },
  13: {
    id: 13,
    name: "4V4_Ai_Easy",
    localizedName: "4v4 AI Easy",
  },
  14: {
    id: 14,
    name: "4V4_Ai_Medium",
    localizedName: "4v4 AI Medium",
  },
  15: {
    id: 15,
    name: "4V4_Ai_Hard",
    localizedName: "4v4 AI Hard",
  },
  16: {
    id: 16,
    name: "4V4_Ai_Expert",
    localizedName: "4v4 AI Expert",
  },
  20: {
    id: 20,
    name: "1V1_Unranked",
    localizedName: "1 vs 1",
  },
  21: {
    id: 21,
    name: "2V2_Unranked",
    localizedName: "2 vs 2",
  },
  22: {
    id: 22,
    name: "3V3_Unranked",
    localizedName: "3 vs 3",
  },
  23: {
    id: 23,
    name: "4V4_Unranked",
    localizedName: "4 vs 4",
  },
};

// Race ID mapping
export const raceIDs: Record<raceID, raceType> = {
  129494: "american",
  137123: "german",
  197345: "british",
  198437: "dak",
  // WTF? This is British_Africa but localized name is still British
  203852: "british",
};

/**
 * Get match duration formatted as MM:SS
 */
export const getMatchDuration = (startTime: number, endTime: number): string => {
  const duration = endTime - startTime;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Get players by faction (axis/allies) from match results
 */
export const getMatchPlayersByFaction = (
  playerReports: any[],
  faction: "axis" | "allies",
): any[] => {
  // For COH3, using actual race_id values:
  // German and DAK are Axis, American and British are Allies
  const axisFactions = Object.keys(raceIDs)
    .map(Number)
    .filter((raceId) => ["german", "dak"].includes(raceIDs[raceId as raceID]));
  const alliesFactions = Object.keys(raceIDs)
    .map(Number)
    .filter((raceId) => ["american", "british"].includes(raceIDs[raceId as raceID]));

  return playerReports.filter((player) => {
    if (faction === "axis") {
      return axisFactions.includes(player.race_id);
    } else {
      return alliesFactions.includes(player.race_id);
    }
  });
};

/**
 * Get player's match result from the match data
 */
export const getPlayerMatchHistoryResult = (
  match: ProcessedMatch,
  profileID: string | number,
): any | null => {
  return match.matchhistoryreportresults.find(
    (player) => player.profile_id.toString() === profileID.toString(),
  );
};

/**
 * Check if player was victorious in the match
 */
export const isPlayerVictorious = (
  match: ProcessedMatch,
  profileID: string | number,
): boolean => {
  const playerResult = getPlayerMatchHistoryResult(match, profileID);
  return playerResult?.resulttype === 1; // 1 = victory, 0 = defeat
};
