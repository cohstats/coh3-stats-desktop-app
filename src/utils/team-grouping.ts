import { TeamDetails } from "./data-types";

/**
 * Represents a group of players who are known to play together
 */
export interface KnownFriendsGroup {
  playerIds: number[];
  teams: TeamDetails[];
  color?: string;
}

/**
 * Groups players based on transitive team relationships.
 *
 * Example scenarios:
 * - Players A, B, C, D in a match
 * - If A teams with B, and B teams with C, creates group [A, B, C]
 * - If D has no connection, D is excluded
 * - Can create multiple groups: [A, B] and [C, D] if they have no common link
 *
 * @param teams - Array of team details from search API
 * @param playerIds - Array of player IDs in the current match (max 4 players)
 * @returns Array of known friends groups
 */
export const groupPlayersByTeamRelationships = (
  teams: TeamDetails[],
  playerIds: number[],
): KnownFriendsGroup[] => {
  if (teams.length === 0 || playerIds.length === 0) {
    return [];
  }

  // Build adjacency map: player -> set of players they've teamed with
  const adjacencyMap = new Map<number, Set<number>>();

  // Initialize adjacency map for all players in the match
  playerIds.forEach((playerId) => {
    adjacencyMap.set(playerId, new Set<number>());
  });

  // Populate adjacency map from team data
  teams.forEach((team) => {
    const teamPlayerIds = team.player_ids;

    // For each pair of players in the team, mark them as connected
    for (let i = 0; i < teamPlayerIds.length; i++) {
      const player1 = teamPlayerIds[i];

      // Only process if this player is in the current match
      if (!playerIds.includes(player1)) continue;

      for (let j = i + 1; j < teamPlayerIds.length; j++) {
        const player2 = teamPlayerIds[j];

        // Only process if this player is in the current match
        if (!playerIds.includes(player2)) continue;

        // Add bidirectional connection
        adjacencyMap.get(player1)?.add(player2);
        adjacencyMap.get(player2)?.add(player1);
      }
    }
  });

  // Find connected components using DFS
  const visited = new Set<number>();
  const groups: KnownFriendsGroup[] = [];

  const dfs = (playerId: number, currentGroup: Set<number>) => {
    visited.add(playerId);
    currentGroup.add(playerId);

    const neighbors = adjacencyMap.get(playerId);
    if (neighbors) {
      neighbors.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          dfs(neighborId, currentGroup);
        }
      });
    }
  };

  // Find all connected components
  playerIds.forEach((playerId) => {
    if (!visited.has(playerId)) {
      const currentGroup = new Set<number>();
      dfs(playerId, currentGroup);

      // Only include groups with 2+ players (actual teams)
      if (currentGroup.size >= 2) {
        const groupPlayerIds = Array.from(currentGroup).sort();

        // Find all teams that are subsets of this group
        const relevantTeams = teams.filter((team) => {
          // Check if all team players are in the current group
          return team.player_ids.every((pid) => currentGroup.has(pid));
        });

        groups.push({
          playerIds: groupPlayerIds,
          teams: relevantTeams,
        });
      }
    }
  });

  return groups;
};

/**
 * Checks if a specific set of players forms a complete team
 * (all players have played together as a team)
 *
 * @param teams - Array of team details from search API
 * @param playerIds - Array of player IDs to check
 * @returns The team details if found, null otherwise
 */
export const findCompleteTeam = (
  teams: TeamDetails[],
  playerIds: number[],
): TeamDetails | null => {
  const sortedPlayerIds = [...playerIds].sort();

  return (
    teams.find((team) => {
      const sortedTeamIds = [...team.player_ids].sort();
      return (
        sortedTeamIds.length === sortedPlayerIds.length &&
        sortedTeamIds.every((id, index) => id === sortedPlayerIds[index])
      );
    }) || null
  );
};

/**
 * Finds the largest team that includes the given player
 *
 * @param teams - Array of team details from search API
 * @param playerId - Player ID to search for
 * @returns The largest team containing the player, or null if not found
 */
export const findLargestTeamForPlayer = (
  teams: TeamDetails[],
  playerId: number,
): TeamDetails | null => {
  const playerTeams = teams.filter((team) => team.player_ids.includes(playerId));

  if (playerTeams.length === 0) {
    return null;
  }

  // Sort by team size (number of players) in descending order
  playerTeams.sort((a, b) => b.player_ids.length - a.player_ids.length);

  return playerTeams[0];
};
