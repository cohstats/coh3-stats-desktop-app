import { fetch, ResponseType } from "@tauri-apps/api/http";
import { LRUCache } from "lru-cache";
import config from "../config";
import { TeamDetails } from "./data-types";

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
  const path = `/sharedAPIGen2Http/teams/${teamID}`;
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
        "Accept-Encoding": "br",
        Accept: "application/json",
      },
      responseType: ResponseType.JSON,
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Cache 404 result to avoid repeated requests
        teamDetailsCache.set(cacheKey, { found: false, data: null });
        return null;
      }
      if (response.status === 500) {
        const data = response.data as any;
        throw new Error(`Error getting team details: ${data.error}`);
      }
      throw new Error(`Error getting team details`);
    }

    const teamDetails = response.data as TeamDetails;
    // Cache successful result
    teamDetailsCache.set(cacheKey, { found: true, data: teamDetails });
    return teamDetails;
  } catch (error) {
    console.error(`Error fetching team details for team ${teamID}:`, error);
    throw error;
  }
};
