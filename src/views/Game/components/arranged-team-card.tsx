import React, { useEffect, useState } from "react";
import { Paper, Text, Group, Stack, Loader, Badge, Tooltip, Anchor } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { open } from "@tauri-apps/plugin-shell";
import { FullPlayerData, TeamSide } from "../../../game-data-provider/GameData-types";
import { getTeamDetails } from "../../../utils/coh3-stats-api";
import { TeamDetails } from "../../../utils/data-types";
import { coh3statsTeamDetails } from "../../../utils/external-routes";

interface ArrangedTeamCardProps {
  players: FullPlayerData[];
  side: TeamSide;
}

/**
 * Creates a team key for API lookup
 * @param team Object with side and player_ids
 * @returns Team key string
 */
const _createTeamKey = (team: { side: string; player_ids: number[] }) => {
  return `${team.side}-${team.player_ids.sort().join("-")}`;
};

export const ArrangedTeamCard: React.FC<ArrangedTeamCardProps> = ({ players, side }) => {
  const [teamData, setTeamData] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Extract player IDs and convert to numbers
        const playerIds = players
          .filter((player) => !player.ai) // Only real players
          .map((player) => parseInt(player.relicID, 10))
          .filter((id) => !isNaN(id)); // Filter out invalid IDs

        if (playerIds.length === 0) {
          setLoading(false);
          return;
        }

        // Generate team key
        const teamKey = _createTeamKey({
          side: side.toLowerCase(),
          player_ids: playerIds,
        });

        // Fetch team details
        const team = await getTeamDetails(teamKey);
        setTeamData(team);
      } catch (err) {
        // If team is not found or any other error, don't render the component
        console.log("Arranged team not found or error occurred:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [players, side]);

  // Don't render anything while loading
  if (loading) {
    return (
      <Paper shadow="xs" withBorder p="xs" mb="xs">
        <Group justify="center">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Checking for arranged team...
          </Text>
        </Group>
      </Paper>
    );
  }

  // If no team found or error occurred, show random team info
  if (error || !teamData) {
    return (
      <Paper shadow="xs" withBorder p="xs" mb="xs">
        <Group justify="center" align="center" pos="relative">
          <Badge color="gray" variant="filled">
            Random Team
          </Badge>
          <Tooltip
            label="It's still possible that this team is not yet tracked by coh3stats, head over to the about page to learn more about arranged teams."
            multiline
            w={300}
            withArrow
            style={{ position: "absolute", right: 0 }}
          >
            <IconInfoCircle size={16} style={{ color: "var(--mantine-color-dimmed)" }} />
          </Tooltip>
        </Group>
      </Paper>
    );
  }

  // Calculate win/loss ratio
  const winLossRatio = teamData.t > 0 ? Math.round((teamData.w / teamData.t) * 100) : 0;

  // Generate team details URL using the team ID and first player ID from the API response
  const firstPlayerId = teamData.players[0]?.profile_id;
  const teamDetailsUrl =
    firstPlayerId && teamData.id ? coh3statsTeamDetails(firstPlayerId, teamData.id) : null;

  return (
    <Paper shadow="xs" withBorder p="xs" mb="xs">
      <Group justify="center" align="center">
        {teamDetailsUrl ? (
          <Anchor onClick={() => open(teamDetailsUrl)}>
            <Badge color="blue" variant="filled" style={{ cursor: "pointer" }}>
              Arranged Team
            </Badge>
          </Anchor>
        ) : (
          <Badge color="blue" variant="filled">
            Arranged Team
          </Badge>
        )}

        <Group gap="md">
          <Tooltip label="ELO Rating" withArrow>
            <Text>{teamData.elo}</Text>
          </Tooltip>
          <Text c={teamData.s > 0 ? "green" : teamData.s < 0 ? "red" : "gray"}>
            {teamData.s > 0 ? `+${teamData.s}` : teamData.s}
          </Text>
          <Text>{winLossRatio}%</Text>
          <Text c="green">{teamData.w} W</Text>
          <Text c="red">{teamData.l} L</Text>
        </Group>
      </Group>
    </Paper>
  );
};
