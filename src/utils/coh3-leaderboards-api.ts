import { fetch } from "@tauri-apps/plugin-http";
import config from "../config";
import { leaderBoardType, platformType, raceType, RawLaddersObject } from "../coh3-types";
import {
  apiTitleTypes,
  leaderboardRegions,
  LeaderboardRegionTypes,
  leaderboardsIDAsObject,
} from "../coh3-data";

/**
 * Builds the URL for fetching leaderboard data from Relic API
 * @param leaderboard_id - The leaderboard ID
 * @param sortBy - 1 for ELO, 0 for Wins
 * @param count - Number of records to fetch (1-200)
 * @param start - Starting position
 * @param platform - Platform type (default: "steam")
 * @param region - Optional region filter
 * @returns The encoded URL string
 */
const _getLeaderBoardsUrl = (
  leaderboard_id: number,
  sortBy = 0,
  count = 100,
  start = 1,
  platform: platformType = "steam",
  region: LeaderboardRegionTypes | null = null,
): string => {
  const title = apiTitleTypes[platform];

  return encodeURI(
    `${config.BASE_RELIC_API_URL}/community/leaderboard/getleaderboard2?count=${count}&leaderboard_id=${leaderboard_id}&start=${start}&sortBy=${sortBy}${region ? `&leaderboardRegion_id=${leaderboardRegions[region].id}` : ""}&title=${title}`,
  );
};

/**
 * Fetches leaderboard data from the Relic API
 * @param race - The faction/race type
 * @param leaderBoardType - The game mode type (1v1, 2v2, etc.)
 * @param sortBy - 1 for ELO, 0 for Wins
 * @param count - Number of records to fetch
 * @param start - Starting position
 * @param platform - Platform type (default: "steam")
 * @param region - Optional region filter
 * @returns Promise<RawLaddersObject>
 * @throws Error when API request fails
 */
export const getLeaderBoardData = async (
  race: raceType,
  leaderBoardType: leaderBoardType,
  sortBy: number,
  count: number,
  start: number,
  platform: platformType = "steam",
  region: LeaderboardRegionTypes | null = null,
): Promise<RawLaddersObject> => {
  const lbID = leaderboardsIDAsObject[leaderBoardType][race];
  const url = _getLeaderBoardsUrl(lbID, sortBy, count, start, platform, region);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    if (!response.ok) {
      const error = `Leaderboard API request failed with status ${response.status}: ${response.statusText}`;
      console.error(error, { url, status: response.status, statusText: response.statusText });
      throw new Error(error);
    }

    const data = (await response.json()) as RawLaddersObject;

    // Check for API-level errors
    if (data.result && data.result.message !== "SUCCESS") {
      throw new Error(`API returned error: ${data.result.message}`);
    }

    return data;
  } catch (error) {
    console.error(`Error fetching leaderboard data:`, error);
    throw error;
  }
};
