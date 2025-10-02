import { fetch } from "@tauri-apps/plugin-http";
import config from "../config";
import { RawMatchObject, RawProfile } from "./data-types";

// Platform types for COH3
export type platformType = "steam" | "xbox" | "psn";

// API title mapping for different platforms
export const apiTitleTypes: Record<platformType, string> = {
  steam: "coh3",
  xbox: "coh3xbl",
  psn: "coh3psn",
};

// Relic API result structure
export interface RelicAPIResult {
  code: number;
  message: string;
}

// Raw match history response structure
export interface RawMatchHistoryResponse {
  matchHistoryStats: RawMatchObject[];
  profiles: RawProfile[];
  platform: platformType;
}
/**
 * Fetches recent match history for a player from the Relic API
 * @param relicProfileID - The player's Relic profile ID
 * @param platform - The platform type (default: "steam")
 * @returns Promise<RawMatchHistoryResponse>
 * @throws Error when API request fails or player is not found
 */
export const fetchPlayerMatches = async (
  relicProfileID: string,
  platform: platformType = "steam",
): Promise<RawMatchHistoryResponse> => {
  const url = getRecentMatchHistoryUrl(relicProfileID, platform);

  try {
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw Object.assign(new Error(`HTTP error! status: ${response.status}`), { response });
    }

    const data = (await response.json()) as any;

    if (data?.result?.message === "SUCCESS") {
      // Remove the result field as it's not needed in the response
      delete data.result;

      // Add the platform to the data
      data.platform = platform;

      return data as RawMatchHistoryResponse;
    } else if (data?.result?.message === "UNREGISTERED_PROFILE_NAME") {
      console.error(`Tried to get matches for non existing player id ${relicProfileID}`);
      throw Object.assign(new Error("Tried to fetch matches for UNREGISTERED_PROFILE_NAME"), {
        response,
      });
    } else {
      throw Object.assign(new Error("Failed to receive the player's match history"), {
        response,
      });
    }
  } catch (error) {
    console.error(`Error fetching match history for player ${relicProfileID}:`, error);
    throw error;
  }
};

/**
 * Builds the URL for fetching recent match history from Relic API
 * @param profileID - The player's profile ID
 * @param platform - The platform type (default: "steam")
 * @returns The encoded URL string
 */
export const getRecentMatchHistoryUrl = (
  profileID: string,
  platform: platformType = "steam",
): string => {
  const title = apiTitleTypes[platform];

  return encodeURI(
    `${config.BASE_RELIC_API_URL}/community/leaderboard/getrecentmatchhistorybyprofileId?profile_id=${profileID}&title=${title}`,
  );
};
