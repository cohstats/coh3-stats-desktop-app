# Team Grouping Utilities

This module provides utilities for detecting "known friends" groups based on transitive team relationships from arranged team search data.

## Overview

When analyzing a match with players A, B, C, and D, the system can detect which players have previously played together as teams. The key insight is that team relationships are **transitive**:

- If Player A has teamed with Player B, and
- Player B has teamed with Player C,
- Then A, B, and C form a "known friends" group

## Core Function: `groupPlayersByTeamRelationships`

This is the main function that analyzes team data and groups players based on their relationships.

### Parameters

- `teams: TeamDetails[]` - Array of team details from the search API
- `playerIds: number[]` - Array of player IDs in the current match (max 4 players)

### Returns

`KnownFriendsGroup[]` - Array of groups, where each group contains:

- `playerIds: number[]` - Sorted array of player IDs in the group
- `teams: TeamDetails[]` - All teams that are subsets of this group

### Algorithm

The function uses a graph-based approach:

1. **Build Adjacency Map**: Creates a graph where each player is a node, and edges connect players who have teamed together
2. **Find Connected Components**: Uses Depth-First Search (DFS) to find all connected groups of players
3. **Filter Results**: Only returns groups with 2+ players (actual teams)

### Example Scenarios

#### Scenario 1: Transitive Relationships (A-B-C)

```typescript
// Match players: A, B, C, D
// Team data shows:
// - A and B have teamed together
// - B and C have teamed together

const teams = [
  { player_ids: [1, 2], ... }, // A-B team
  { player_ids: [2, 3], ... }, // B-C team
];

const result = groupPlayersByTeamRelationships(teams, [1, 2, 3, 4]);
// Result: 1 group containing [1, 2, 3]
// Player 4 (D) is excluded as they have no connections
```

#### Scenario 2: Two Separate Groups (A-B and C-D)

```typescript
// Match players: A, B, C, D
// Team data shows:
// - A and B have teamed together
// - C and D have teamed together
// - No connection between the two pairs

const teams = [
  { player_ids: [1, 2], ... }, // A-B team
  { player_ids: [3, 4], ... }, // C-D team
];

const result = groupPlayersByTeamRelationships(teams, [1, 2, 3, 4]);
// Result: 2 groups
// Group 1: [1, 2]
// Group 2: [3, 4]
```

#### Scenario 3: Complete Team (A-B-C-D)

```typescript
// All 4 players have played together

const teams = [
  { player_ids: [1, 2, 3, 4], ... }, // All 4 players
];

const result = groupPlayersByTeamRelationships(teams, [1, 2, 3, 4]);
// Result: 1 group containing [1, 2, 3, 4]
```

## Helper Functions

### `findCompleteTeam`

Checks if a specific set of players forms a complete team (all players have played together).

```typescript
const completeTeam = findCompleteTeam(teams, [1, 2, 3]);
// Returns the TeamDetails if found, null otherwise
```

### `findLargestTeamForPlayer`

Finds the largest team that includes a given player.

```typescript
const largestTeam = findLargestTeamForPlayer(teams, 1);
// Returns the TeamDetails with the most players, or null if not found
```

## Usage in Components

### Integration with ArrangedTeamCard

The `groupPlayersByTeamRelationships` function can be used to enhance the `ArrangedTeamCard` component to show partial teams or "known friends" groups:

```typescript
// In ArrangedTeamCard component
const resultSearch = await searchArrangedTeams(side, playerIds);

if (resultSearch.totalTeams > 0) {
  // First, try to find a complete team
  const completeTeam = findCompleteTeam(resultSearch.teams, playerIds);

  if (completeTeam) {
    // Show complete arranged team
    setTeamData(completeTeam);
  } else {
    // Find known friends groups
    const groups = groupPlayersByTeamRelationships(resultSearch.teams, playerIds);

    if (groups.length > 0) {
      // Show partial team or known friends information
      // Could display: "Known Friends: Players A, B, C"
    }
  }
}
```

## Performance Considerations

- **Time Complexity**: O(T × P²) where T is the number of teams and P is the number of players (max 4)
  - Building adjacency map: O(T × P²)
  - DFS traversal: O(P²) in worst case
- **Space Complexity**: O(P²) for the adjacency map

Since P is always ≤ 4 in COH3, the performance is excellent even with many teams.

## Edge Cases Handled

1. **Empty team data**: Returns empty array
2. **No connections**: Returns empty array (no groups with 2+ players)
3. **Players not in match**: Ignores players from team data who aren't in the current match
4. **Duplicate teams**: Handles gracefully (won't create duplicate edges)
5. **Different player order**: Sorts player IDs for consistent results

## Testing

See `team-grouping.example.ts` for comprehensive examples demonstrating all scenarios.

## Future Enhancements

Potential improvements:

1. Add team strength scoring based on number of games played together
2. Calculate average ELO for partial teams
3. Detect "core" players who appear in multiple teams
4. Show team history and recent performance
