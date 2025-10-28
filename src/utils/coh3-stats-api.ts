import { fetch } from "@tauri-apps/plugin-http";
import { LRUCache } from "lru-cache";
import config from "../config";
import { TeamDetails } from "./data-types";

/**
 * Type for team side (allies or axis)
 */
export type TeamSideForCOH3ApiSearch = "allies" | "axis";

/**
 * Response type for team search API
 */
export interface TeamSearchResponse {
  teams: TeamDetails[];
  totalTeams: number;
}

// Cache result wrapper to handle both successful and failed lookups
interface CachedTeamResult {
  found: boolean;
  data: TeamDetails | null;
}

// LRU cache for team details with 5-minute TTL and max 1000 items
const teamDetailsCache = new LRUCache<string, CachedTeamResult>({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
});

/**
 * Builds the URL for fetching team details from COH3 Stats API
 * @param teamID - The team ID
 * @returns The encoded URL string
 */
export const getTeamDetailsUrl = (teamID: string | number): string => {
  const path = `/sharedAPIGen2Http/teams/${teamID}/exists`;
  return encodeURI(`${config.BASE_CLOUD_FUNCTIONS_PROXY_URL}${path}`);
};

/**
 * Fetches team details from the COH3 Stats API with LRU caching
 * @param teamID - The team ID
 * @returns Promise<TeamDetails>
 * @throws Error when API request fails or team is not found
 */
export const getTeamDetails = async (teamID: string | number): Promise<TeamDetails | null> => {
  const cacheKey = String(teamID);

  // Check cache first
  const cachedResult = teamDetailsCache.get(cacheKey);
  if (cachedResult !== undefined) {
    return cachedResult.found ? cachedResult.data : null;
  }

  const url = getTeamDetailsUrl(teamID);

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept-Encoding": "gzip",
        Accept: "application/json",
        Origin: "https://coh3stats.com",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Cache 404 result to avoid repeated requests
        teamDetailsCache.set(cacheKey, { found: false, data: null });
        return null;
      }
      if (response.status === 500) {
        const data = (await response.json()) as any;
        console.error(`Error getting team details: ${data.error}`);
        throw new Error(`Error getting team details: ${data.error}`);
      }
      console.error(`Error getting team details: ${response.status} ${response.statusText}`);
      throw new Error(`Error getting team details`);
    }

    const responseData = (await response.json()) as {
      id: string;
      data: TeamDetails | null;
      exists: boolean;
    };

    if (!responseData.exists || !responseData.data) {
      teamDetailsCache.set(cacheKey, { found: false, data: null });
      return null;
    } else {
      teamDetailsCache.set(cacheKey, { found: true, data: responseData.data });
      return responseData.data;
    }
  } catch (error) {
    console.error(`Error fetching team details for team ${teamID}:`, error);
    throw error;
  }
};

/**
 * Builds the URL for searching arranged teams from COH3 Stats API
 * @param side - The team side (allies or axis)
 * @param profileIds - Array of profile IDs
 * @returns The encoded URL string
 */
export const getTeamSearchUrl = (
  side: TeamSideForCOH3ApiSearch,
  profileIds: number[],
): string => {
  const profileIdsParam = encodeURIComponent(JSON.stringify(profileIds));
  const path = `/sharedAPIGen2Http/teams/search?side=${side}&profileIds=${profileIdsParam}`;
  return `${config.BASE_CLOUD_FUNCTIONS_PROXY_URL}${path}`;
};

/**
 * Searches for arranged teams from the COH3 Stats API
 * @param side - The team side (allies or axis)
 * @param profileIds - Array of profile IDs to search for
 * @returns Promise<TeamSearchResponse>
 * @throws Error when API request fails
 */
export const searchArrangedTeams = async (
  side: TeamSideForCOH3ApiSearch,
  profileIds: number[],
): Promise<TeamSearchResponse> => {
  const url = getTeamSearchUrl(side, profileIds);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
        Accept: "application/json",
        Origin: "https://coh3stats.com",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Return empty result for 404
        return { teams: [], totalTeams: 0 };
      }
      if (response.status === 500) {
        const data = (await response.json()) as any;
        console.error(`Error searching arranged teams: ${data.error}`);
        throw new Error(`Error searching arranged teams: ${data.error}`);
      }
      console.error(`Error searching arranged teams: ${response.status} ${response.statusText}`);
      throw new Error(`Error searching arranged teams`);
    }

    return (await response.json()) as TeamSearchResponse;
  } catch (error) {
    console.error(`Error searching arranged teams for side ${side}:`, error);
    throw error;
  }
};
