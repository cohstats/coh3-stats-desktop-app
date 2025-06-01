import { fetch, ResponseType } from "@tauri-apps/api/http";
import config from "../config";
import { TeamDetails } from "./data-types";

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
 * Fetches team details from the COH3 Stats API
 * @param teamID - The team ID
 * @returns Promise<TeamDetails>
 * @throws Error when API request fails or team is not found
 */
export const getTeamDetails = async (teamID: string | number): Promise<TeamDetails | null> => {
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
        return null;
      }
      if (response.status === 500) {
        const data = response.data as any;
        throw new Error(`Error getting team details: ${data.error}`);
      }
      throw new Error(`Error getting team details`);
    }

    return response.data as TeamDetails;
  } catch (error) {
    console.error(`Error fetching team details for team ${teamID}:`, error);
    throw error;
  }
};
