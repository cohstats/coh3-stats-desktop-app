/**
 * EXAMPLE USAGE OF TEAM GROUPING UTILITIES
 *
 * This file demonstrates how to use the team grouping functions to detect
 * "known friends" based on transitive team relationships.
 */

import { groupPlayersByTeamRelationships, findCompleteTeam } from "./team-grouping";
import { TeamDetails } from "./data-types";

// ============================================================================
// EXAMPLE 1: Transitive Team Relationships (A-B-C)
// ============================================================================
// Scenario: Players A, B, C, D in a match
// - Player A has teamed with Player B
// - Player B has teamed with Player C
// - This creates a "known friends" group: [A, B, C]
// - Player D has no connections, so is excluded

const example1Teams: TeamDetails[] = [
  {
    id: "allies-1-2",
    player_ids: [1, 2], // A and B
    players: [
      { profile_id: 1, alias: "PlayerA", country: "US" },
      { profile_id: 2, alias: "PlayerB", country: "CA" },
    ],
    type: "2v2",
    side: "allies",
    elo: 1500,
    bestElo: 1600,
    w: 10,
    l: 5,
    s: 2,
    t: 15,
    lmTS: Date.now(),
    mh: [],
  },
  {
    id: "allies-2-3",
    player_ids: [2, 3], // B and C
    players: [
      { profile_id: 2, alias: "PlayerB", country: "CA" },
      { profile_id: 3, alias: "PlayerC", country: "UK" },
    ],
    type: "2v2",
    side: "allies",
    elo: 1450,
    bestElo: 1550,
    w: 8,
    l: 7,
    s: 1,
    t: 15,
    lmTS: Date.now(),
    mh: [],
  },
];

const example1PlayerIds = [1, 2, 3, 4]; // A, B, C, D in the match

const example1Result = groupPlayersByTeamRelationships(example1Teams, example1PlayerIds);
console.log("Example 1 - Transitive relationships:");
console.log("Groups found:", example1Result.length); // 1
console.log("Group 1 players:", example1Result[0]?.playerIds); // [1, 2, 3]
console.log("Group 1 teams:", example1Result[0]?.teams.length); // 2

// ============================================================================
// EXAMPLE 2: Two Separate Groups (A-B and C-D)
// ============================================================================
// Scenario: Players A, B, C, D in a match
// - Player A has teamed with Player B
// - Player C has teamed with Player D
// - No connection between the two pairs
// - Creates two groups: [A, B] and [C, D]

const example2Teams: TeamDetails[] = [
  {
    id: "allies-1-2",
    player_ids: [1, 2], // A and B
    players: [
      { profile_id: 1, alias: "PlayerA", country: "US" },
      { profile_id: 2, alias: "PlayerB", country: "CA" },
    ],
    type: "2v2",
    side: "allies",
    elo: 1500,
    bestElo: 1600,
    w: 10,
    l: 5,
    s: 2,
    t: 15,
    lmTS: Date.now(),
    mh: [],
  },
  {
    id: "allies-3-4",
    player_ids: [3, 4], // C and D
    players: [
      { profile_id: 3, alias: "PlayerC", country: "UK" },
      { profile_id: 4, alias: "PlayerD", country: "DE" },
    ],
    type: "2v2",
    side: "allies",
    elo: 1450,
    bestElo: 1550,
    w: 8,
    l: 7,
    s: 1,
    t: 15,
    lmTS: Date.now(),
    mh: [],
  },
];

const example2PlayerIds = [1, 2, 3, 4];

const example2Result = groupPlayersByTeamRelationships(example2Teams, example2PlayerIds);
console.log("\nExample 2 - Two separate groups:");
console.log("Groups found:", example2Result.length); // 2
console.log("Group 1 players:", example2Result[0]?.playerIds); // [1, 2]
console.log("Group 2 players:", example2Result[1]?.playerIds); // [3, 4]

// ============================================================================
// EXAMPLE 3: Complete 4-Player Team
// ============================================================================
// Scenario: All 4 players have played together as a team

const example3Teams: TeamDetails[] = [
  {
    id: "allies-1-2-3-4",
    player_ids: [1, 2, 3, 4], // All 4 players
    players: [
      { profile_id: 1, alias: "PlayerA", country: "US" },
      { profile_id: 2, alias: "PlayerB", country: "CA" },
      { profile_id: 3, alias: "PlayerC", country: "UK" },
      { profile_id: 4, alias: "PlayerD", country: "DE" },
    ],
    type: "4v4",
    side: "allies",
    elo: 1600,
    bestElo: 1700,
    w: 20,
    l: 10,
    s: 5,
    t: 30,
    lmTS: Date.now(),
    mh: [],
  },
];

const example3PlayerIds = [1, 2, 3, 4];

const example3Result = groupPlayersByTeamRelationships(example3Teams, example3PlayerIds);
console.log("\nExample 3 - Complete 4-player team:");
console.log("Groups found:", example3Result.length); // 1
console.log("Group 1 players:", example3Result[0]?.playerIds); // [1, 2, 3, 4]

// Also check if this is a complete team
const completeTeam = findCompleteTeam(example3Teams, example3PlayerIds);
console.log("Is complete team:", completeTeam !== null); // true
console.log("Team ELO:", completeTeam?.elo); // 1600

// ============================================================================
// EXAMPLE 4: Complex Transitive Relationships
// ============================================================================
// Scenario: Multiple overlapping teams creating one large group
// - A teams with B
// - B teams with C
// - A teams with C (additional connection)
// - All three should be in one group

const example4Teams: TeamDetails[] = [
  {
    id: "allies-1-2",
    player_ids: [1, 2],
    players: [
      { profile_id: 1, alias: "PlayerA", country: "US" },
      { profile_id: 2, alias: "PlayerB", country: "CA" },
    ],
    type: "2v2",
    side: "allies",
    elo: 1500,
    bestElo: 1600,
    w: 10,
    l: 5,
    s: 2,
    t: 15,
    lmTS: Date.now(),
    mh: [],
  },
  {
    id: "allies-2-3",
    player_ids: [2, 3],
    players: [
      { profile_id: 2, alias: "PlayerB", country: "CA" },
      { profile_id: 3, alias: "PlayerC", country: "UK" },
    ],
    type: "2v2",
    side: "allies",
    elo: 1450,
    bestElo: 1550,
    w: 8,
    l: 7,
    s: 1,
    t: 15,
    lmTS: Date.now(),
    mh: [],
  },
  {
    id: "allies-1-3",
    player_ids: [1, 3],
    players: [
      { profile_id: 1, alias: "PlayerA", country: "US" },
      { profile_id: 3, alias: "PlayerC", country: "UK" },
    ],
    type: "2v2",
    side: "allies",
    elo: 1480,
    bestElo: 1580,
    w: 12,
    l: 8,
    s: 3,
    t: 20,
    lmTS: Date.now(),
    mh: [],
  },
];

const example4PlayerIds = [1, 2, 3, 4];

const example4Result = groupPlayersByTeamRelationships(example4Teams, example4PlayerIds);
console.log("\nExample 4 - Complex transitive relationships:");
console.log("Groups found:", example4Result.length); // 1
console.log("Group 1 players:", example4Result[0]?.playerIds); // [1, 2, 3]
console.log("Group 1 teams:", example4Result[0]?.teams.length); // 3 (all teams are relevant)

// ============================================================================
// EXAMPLE 5: Partial Team (3 players)
// ============================================================================
// Scenario: 3 out of 4 players have teamed together

const example5Teams: TeamDetails[] = [
  {
    id: "allies-1-2-3",
    player_ids: [1, 2, 3],
    players: [
      { profile_id: 1, alias: "PlayerA", country: "US" },
      { profile_id: 2, alias: "PlayerB", country: "CA" },
      { profile_id: 3, alias: "PlayerC", country: "UK" },
    ],
    type: "3v3",
    side: "allies",
    elo: 1550,
    bestElo: 1650,
    w: 15,
    l: 10,
    s: 3,
    t: 25,
    lmTS: Date.now(),
    mh: [],
  },
];

const example5PlayerIds = [1, 2, 3, 4];

const example5Result = groupPlayersByTeamRelationships(example5Teams, example5PlayerIds);
console.log("\nExample 5 - Partial team (3 players):");
console.log("Groups found:", example5Result.length); // 1
console.log("Group 1 players:", example5Result[0]?.playerIds); // [1, 2, 3]
console.log("Player 4 excluded:", !example5Result[0]?.playerIds.includes(4)); // true
