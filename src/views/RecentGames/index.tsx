import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Title,
  Text,
  Loader,
  Stack,
  Group,
  Badge,
  Button,
  Alert,
  Switch,
  Center,
  Flex,
  Anchor,
} from "@mantine/core";
import { IconInfoCircle, IconRefresh, IconEyePlus } from "@tabler/icons-react";
import { open as openLink } from "@tauri-apps/plugin-shell";
import { DataTable } from "mantine-datatable";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { getPlayerMatches } from "../../utils/coh3-matches";
import { coh3statsPlayerProfile } from "../../utils/external-routes";
import { ProcessedMatch } from "../../utils/data-types";
import { showNotification } from "../../utils/notifications";
import { useLogFilePath, usePlayerProfileID } from "../../game-data-provider/configValues";
import {
  matchTypesAsObject,
  raceIDs,
  getMatchDuration,
  getMatchPlayersByFaction,
  getPlayerMatchHistoryResult,
  isPlayerVictorious,
} from "../../utils/match-helpers";
import ErrorCard from "../../components/ErrorCard";
import RenderPlayers from "./matches-table/render-players";
import RenderMap from "./matches-table/render-map";
import MatchDetailDrawer from "./match-detail-drawer";
import classes from "./matches-table.module.css";
import events from "../../mixpanel/mixpanel";

/**
 * Simple time ago calculation
 */
const getTimeAgo = (timestamp: number): string => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const diff = now - timestamp;

  if (diff < 60) {
    return "just now";
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (diff < 2592000) {
    const days = Math.floor(diff / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else if (diff < 31536000) {
    const months = Math.floor(diff / 2592000);
    return `${months} month${months !== 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diff / 31536000);
    return `${years} year${years !== 1 ? "s" : ""} ago`;
  }
};

export const RecentGames: React.FC = () => {
  const [matchData, setMatchData] = useState<ProcessedMatch[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [playerProfileID] = usePlayerProfileID();

  const [logFilePath] = useLogFilePath();

  // Extract current player's relic ID from game data
  const currentPlayerRelicId = playerProfileID;
  // Enhanced table functionality
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedMatchRecord, setSelectedMatchRecord] = useState<ProcessedMatch | null>(null);
  const [showCountryFlag, setShowCountryFlag] = useLocalStorage({
    key: "show-country-flag-matches",
    defaultValue: "false",
  });

  const loadPlayerMatches = async (relicProfileId: string) => {
    if (!relicProfileId.trim()) {
      setError("No player profile ID available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPlayerMatches(relicProfileId);
      setMatchData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load match history";
      setError(errorMessage);
      showNotification({
        title: "Error",
        message: errorMessage,
        type: "error",
        autoCloseInMs: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const sortedData = useMemo(() => {
    if (!matchData) return [];

    return matchData.sort((a, b) => b.completiontime - a.completiontime);
  }, [matchData]);

  // Automatically load matches when current player is detected
  useEffect(() => {
    if (currentPlayerRelicId && logFilePath !== undefined) {
      loadPlayerMatches(currentPlayerRelicId);
    }
  }, [currentPlayerRelicId, logFilePath]);

  // Track navigation to Recent Games component
  useEffect(() => {
    events.open_recent_games();
  }, []);

  const handleRefresh = () => {
    if (currentPlayerRelicId) {
      loadPlayerMatches(currentPlayerRelicId);
    }
  };

  if (loading) {
    return (
      <Box px="xl" pb="xl" pt="md">
        <Center maw={400} h={250} mx="auto">
          <Loader />
        </Center>
        <div style={{ height: 1000 }}></div>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p="md">
        <ErrorCard title={"Error rendering recent matches"} body={JSON.stringify(error)} />
      </Box>
    );
  }

  if ((!matchData || !currentPlayerRelicId) && !loading) {
    return (
      <Box p="md" pt={"xs"}>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={2}>Recent Games</Title>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefresh}
              disabled={loading || !currentPlayerRelicId}
              variant="light"
            >
              Refresh
            </Button>
          </Group>

          {/* Show current player info when available */}
          {currentPlayerRelicId && (
            <Alert icon={<IconInfoCircle size={16} />} title="Player Detected" color="green">
              <Text size="sm">
                Automatically loading recent matches for current player (ID:{" "}
                {currentPlayerRelicId})
              </Text>
            </Alert>
          )}

          {/* Show waiting message when no player is detected */}
          {!currentPlayerRelicId && logFilePath !== undefined && (
            <Alert icon={<IconInfoCircle size={16} />} title="Waiting for Player" color="blue">
              <Text size="sm">
                Start or join a game to automatically load your recent match history.
              </Text>
            </Alert>
          )}

          {/* Show log file waiting message */}
          {logFilePath === undefined && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Waiting for Log File"
              color="yellow"
            >
              <Text size="sm">Waiting for game log file to be detected...</Text>
            </Alert>
          )}

          <ErrorCard
            title={"Error rendering recent matches"}
            body={"Missing matchData or profileID"}
          />
        </Stack>
      </Box>
    );
  }

  return (
    <Box p="md" pt={"xs"}>
      <Stack gap="md">
        <MatchDetailDrawer
          selectedMatchRecord={selectedMatchRecord}
          opened={opened}
          onClose={close}
        />

        <Group justify="space-between" align="center">
          <Title order={2}>Recent Games</Title>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            disabled={loading || !currentPlayerRelicId}
            variant="light"
          >
            Refresh
          </Button>
        </Group>

        <Flex justify={"space-between"}>
          <Group gap={5} wrap={"nowrap"}>
            <IconInfoCircle size={18} />
            <Text span size={"sm"}>
              Click on the row for more details
            </Text>
          </Group>
          <Switch
            checked={showCountryFlag === "true"}
            onChange={(event) => {
              setShowCountryFlag(`${event.currentTarget.checked}`);
            }}
            label="Show Player Flags"
          />
        </Flex>

        <DataTable<ProcessedMatch>
          borderRadius="md"
          highlightOnHover
          striped
          withTableBorder
          verticalSpacing="xs"
          minHeight={30}
          records={sortedData || []}
          onRowClick={({ record, event }) => {
            if (event.target instanceof Element) {
              const clickedElement = event.target as Element;
              const isClickableElement = clickedElement.closest(
                "a, button, img, .mantine-Button-root",
              );

              if (isClickableElement) {
                return;
              }
            }

            setSelectedMatchRecord(record as unknown as ProcessedMatch);
            open();
          }}
          columns={[
            {
              accessor: "completiontime",
              title: "Played",
              textAlign: "center",
              width: 110,
              render: (record) => {
                const player = currentPlayerRelicId
                  ? getPlayerMatchHistoryResult(
                      record as unknown as ProcessedMatch,
                      currentPlayerRelicId,
                    )
                  : null;
                return (
                  <>
                    <div>
                      {player && (
                        <img
                          src={`/factions/${raceIDs[player.race_id as keyof typeof raceIDs] || "unknown"}.webp`}
                          alt={raceIDs[player.race_id as keyof typeof raceIDs] || "unknown"}
                          width={50}
                          style={{ maxHeight: "50px", objectFit: "contain" }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <Text size="xs" c="dimmed">
                      {getTimeAgo(record.completiontime as number)}
                    </Text>
                  </>
                );
              },
            },
            {
              accessor: "result",
              title: "Result",
              textAlign: "center",
              render: (record) => {
                if (!currentPlayerRelicId) return null;

                const playerResult = getPlayerMatchHistoryResult(
                  record as unknown as ProcessedMatch,
                  currentPlayerRelicId,
                );
                const ratingChange =
                  playerResult?.matchhistorymember?.newrating &&
                  playerResult?.matchhistorymember?.oldrating
                    ? playerResult.matchhistorymember.newrating -
                      playerResult.matchhistorymember.oldrating
                    : undefined;

                if (
                  isPlayerVictorious(record as unknown as ProcessedMatch, currentPlayerRelicId)
                ) {
                  return (
                    <div>
                      <div
                        className={`${classes["row-indicator"]} ${classes["win-indicator"]}`}
                      ></div>
                      <Badge color={"blue"} variant="filled" w={"9ch"}>
                        V +{ratingChange}
                      </Badge>
                    </div>
                  );
                } else {
                  if (playerResult?.resulttype === 0) {
                    return (
                      <>
                        <div
                          className={`${classes["row-indicator"]} ${classes["loss-indicator"]}`}
                        >
                          {ratingChange}
                        </div>
                        <Badge color={"red"} variant="filled" w={"9ch"}>
                          D {ratingChange}
                        </Badge>
                      </>
                    );
                  } else if (playerResult?.resulttype === 4) {
                    return (
                      <Badge color={"gray"} variant="filled" w={"14ch"}>
                        DE-SYNC
                      </Badge>
                    );
                  } else {
                    return (
                      <Badge color={"gray"} variant="filled" w={"14ch"}>
                        ERROR
                      </Badge>
                    );
                  }
                }
              },
            },
            {
              accessor: "axis_players",
              title: "Axis Players",
              textAlign: "left",
              width: "50%",
              render: (record) => {
                const axisPlayers = getMatchPlayersByFaction(
                  record.matchhistoryreportresults as any[],
                  "axis",
                );
                return (
                  <RenderPlayers
                    playerReports={axisPlayers}
                    profileID={currentPlayerRelicId || ""}
                    matchType={record.matchtype_id as number}
                    renderFlag={showCountryFlag === "true"}
                  />
                );
              },
            },
            {
              accessor: "allies_players",
              title: "Allies Players",
              textAlign: "left",
              width: "50%",
              render: (record) => {
                const alliesPlayers = getMatchPlayersByFaction(
                  record.matchhistoryreportresults as any[],
                  "allies",
                );
                return (
                  <RenderPlayers
                    playerReports={alliesPlayers}
                    profileID={currentPlayerRelicId || ""}
                    matchType={record.matchtype_id as number}
                    renderFlag={showCountryFlag === "true"}
                  />
                );
              },
            },
            {
              accessor: "mapname",
              title: "Map",
              width: "90px",
              textAlign: "center",
              render: (record) => {
                return <RenderMap mapName={record.mapname as string} />;
              },
            },
            {
              title: "Mode",
              accessor: "matchtype_id",
              textAlign: "center",
              render: ({ matchtype_id, startgametime, completiontime }) => {
                const matchType =
                  matchTypesAsObject[matchtype_id as number]["localizedName"] ||
                  matchTypesAsObject[matchtype_id as number]["name"] ||
                  "unknown";
                return (
                  <>
                    <div style={{ whiteSpace: "nowrap" }}>{matchType}</div>
                    <span>
                      {getMatchDuration(startgametime as number, completiontime as number)}
                    </span>
                  </>
                );
              },
            },
            {
              accessor: "actions",
              title: "",
              textAlign: "center",
              render: (record) => {
                return (
                  <Button
                    variant="default"
                    size="compact-md"
                    onClick={() => {
                      setSelectedMatchRecord(record as unknown as ProcessedMatch);
                      open();
                    }}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <IconEyePlus size={18} />
                      <Text component="span" visibleFrom="md">
                        Details
                      </Text>
                    </Group>
                  </Button>
                );
              },
            },
          ]}
        />

        {currentPlayerRelicId && (
          <Text span size={"sm"} ta={"center"}>
            Only automatch games are shown <br />
            See{" "}
            <Anchor
              onClick={() => openLink(coh3statsPlayerProfile(currentPlayerRelicId))}
              style={{ cursor: "pointer" }}
            >
              online player card
            </Anchor>{" "}
            for more games
          </Text>
        )}
      </Stack>
    </Box>
  );
};
