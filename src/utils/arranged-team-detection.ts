import { FullPlayerData, TeamSide } from "../game-data-provider/GameData-types";
import { getTeamDetails, searchArrangedTeams, TeamSideForCOH3ApiSearch } from "./coh3-stats-api";
import { TeamDetails } from "./data-types";
import { groupPlayersByTeamRelationships, KnownFriendsGroup } from "./team-grouping";
import config from "../config";

/** Colors for the detected friends groups. */
export const GROUP_COLORS = ["green", "orange", "violet", "pink", "cyan", "blue"];

/**
 * Creates a team key for API lookup
 * @param team Object with side and player_ids
 * @returns Team key string
 */
export const createTeamKey = (team: { side: string; player_ids: number[] }) => {
  return `${team.side}-${team.player_ids.sort().join("-")}`;
};

export interface ArrangedTeamDetectionResult {
  /** The registered arranged team, when all players played together as a team. */
  team: TeamDetails | null;
  /** Friends groups with colors assigned. Only ever non-empty when no team was found. */
  groups: KnownFriendsGroup[];
}

const EMPTY_RESULT: ArrangedTeamDetectionResult = { team: null, groups: [] };

/**
 * Short-lived cache so the Game view and the in-game overlay, which build their data
 * from the same match at the same time, don't double the API calls. The searching part
 * is expensive, which is exactly why the feature is MS Store only.
 */
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { ts: number; result: ArrangedTeamDetectionResult }>();

/**
 * Detects whether one side of a match is an arranged team, or - MS Store edition only -
 * a group of players known to play together.
 *
 * Extracted from ArrangedTeamCard so both the Game view and the in-game overlay use
 * the exact same detection.
 */
export const detectArrangedTeam = async (
  players: FullPlayerData[],
  side: TeamSide,
): Promise<ArrangedTeamDetectionResult> => {
  // Extract player IDs and convert to numbers
  const playerIds = players
    .filter((player) => !player.ai) // Only real players
    .map((player) => parseInt(player.relicID, 10))
    .filter((id) => !isNaN(id)); // Filter out invalid IDs

  if (playerIds.length < 2) {
    return EMPTY_RESULT;
  }

  // Generate team key
  const teamKey = createTeamKey({
    side: side.toLowerCase(),
    player_ids: playerIds,
  });

  const cached = cache.get(teamKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.result;
  }

  const result = await detect(teamKey, playerIds, side);
  cache.set(teamKey, { ts: Date.now(), result });
  return result;
};

const detect = async (
  teamKey: string,
  playerIds: number[],
  side: TeamSide,
): Promise<ArrangedTeamDetectionResult> => {
  // Fetch team details
  const team = await getTeamDetails(teamKey);

  if (team) {
    return { team, groups: [] };
  }

  if (!config.MS_STORE_EDITION || side === "Mixed") {
    return EMPTY_RESULT;
  }

  const resultSearch = await searchArrangedTeams(
    side.toLowerCase() as TeamSideForCOH3ApiSearch,
    playerIds,
  );
  if (resultSearch.totalTeams === 0) {
    console.debug("No teams found for players");
    return EMPTY_RESULT;
  }

  const groups = groupPlayersByTeamRelationships(resultSearch.teams, playerIds);
  if (groups.length === 0) {
    return EMPTY_RESULT;
  }

  // Assign colors to groups
  return {
    team: null,
    groups: groups.map((group, index) => ({
      ...group,
      color: GROUP_COLORS[index % GROUP_COLORS.length],
    })),
  };
};
