import React, { useState, useEffect } from "react";
import {
  Box,
  Title,
  Text,
  Loader,
  Container,
  Group,
  Select,
  Space,
  Image,
  Anchor,
  Center,
} from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { open as openLink } from "@tauri-apps/plugin-shell";
import { getLeaderBoardData } from "../../utils/coh3-leaderboards-api";
import {
  leaderBoardType,
  platformType,
  raceType,
  LaddersDataArrayObject,
} from "../../coh3-types";
import {
  leaderboardRegions,
  LeaderboardRegionTypes,
  localizedGameTypes,
  localizedNames,
} from "../../coh3-data";
import RankIcon from "../../components/other/rank-icon";
import { coh3statsPlayerProfile } from "../../utils/external-routes";
import ErrorCard from "../../components/ErrorCard";
import events from "../../mixpanel/mixpanel";

const RECORD_PER_PAGE = 100;

const calculatePageNumber = (start: number, recordsPerPage: number): number => {
  return Math.floor(start / recordsPerPage) + 1;
};

const calculatePositionNumber = (page: number, recordsPerPage: number): number => {
  return (page - 1) * recordsPerPage + 1;
};

export const Leaderboards: React.FC = () => {
  const [leaderBoardData, setLeaderBoardData] = useState<LaddersDataArrayObject[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter states
  const [race, setRace] = useState<raceType>("american");
  const [type, setType] = useState<leaderBoardType>("1v1");
  const [platform, setPlatform] = useState<platformType>("steam");
  const [region, setRegion] = useState<LeaderboardRegionTypes | null>(null);
  const [start, setStart] = useState(1);

  // Track navigation to Leaderboards
  useEffect(() => {
    events.open_leaderboards();
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getLeaderBoardData(
          race,
          type,
          1,
          RECORD_PER_PAGE,
          start,
          platform,
          region,
        );

        // Process the data to combine stats with member info
        const processedData: LaddersDataArrayObject[] = data.leaderboardStats.map((stat) => {
          const statGroup = data.statGroups.find((sg) => sg.id === stat.statgroup_id);
          return {
            ...stat,
            change: 0,
            members: statGroup?.members || [],
          };
        });

        setLeaderBoardData(processedData);
        setTotalRecords(data.rankTotal || 0);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load leaderboard data";
        setError(errorMessage);
        console.error("Error fetching leaderboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [race, type, platform, region, start]);

  const onPageChange = (p: number) => {
    const startPositionNumber = calculatePositionNumber(p, RECORD_PER_PAGE);
    setStart(startPositionNumber);
  };

  const handleRegionChange = (value: string | null) => {
    if (value === "global") {
      setRegion(null);
    } else {
      setRegion(value as LeaderboardRegionTypes);
    }
    setStart(1); // Reset to first page when changing filters
  };

  const handlePlatformChange = (value: string | null) => {
    if (value) {
      setPlatform(value as platformType);
      setStart(1);
    }
  };

  const handleRaceChange = (value: string | null) => {
    if (value) {
      setRace(value as raceType);
      setStart(1);
    }
  };

  const handleTypeChange = (value: string | null) => {
    if (value) {
      setType(value as leaderBoardType);
      setStart(1);
    }
  };

  if (loading && !leaderBoardData) {
    return (
      <Box px="xl" pb="xl" pt="md">
        <Center maw={400} h={250} mx="auto">
          <Loader />
        </Center>
        <div style={{ height: 1000 }}></div>
      </Box>
    );
  }

  const localizedRace = localizedNames[race];
  const localizedType = localizedGameTypes[type];

  return (
    <Box p={"sm"} pb={"md"}>
      <Container size="lg" p={0}>
        <Container fluid pl={0} pr={0}>
          <Group justify="space-between">
            <Group gap={"sm"}>
              <Image src={`/factions/${race}.webp`} alt={race} w={40} h={40} />
              <Title order={2}>
                {localizedRace} - {localizedType}
              </Title>
            </Group>
            <Group justify="right">
              <Select
                label="Region"
                style={{ width: 140 }}
                value={region || "global"}
                data={[
                  { value: "global", label: "Global" },
                  ...Object.entries(leaderboardRegions).map(([key, regionData]) => ({
                    value: key,
                    label: regionData.name,
                  })),
                ]}
                allowDeselect={false}
                onChange={handleRegionChange}
              />
              <Select
                label="Platform"
                style={{ width: 90 }}
                value={platform}
                allowDeselect={false}
                data={[
                  { value: "steam", label: "PC" },
                  { value: "xbox", label: "XBOX" },
                  { value: "psn", label: "PSN" },
                ]}
                onChange={handlePlatformChange}
              />
              <Select
                label="Faction"
                style={{ width: 190 }}
                value={race}
                allowDeselect={false}
                data={[
                  { value: "american", label: "US Forces" },
                  { value: "german", label: "Wehrmacht" },
                  { value: "dak", label: "Deutsches Afrikakorps" },
                  { value: "british", label: "British Forces" },
                ]}
                onChange={handleRaceChange}
              />
              <Select
                label="Type"
                style={{ width: 90 }}
                value={type}
                allowDeselect={false}
                data={[
                  { value: "1v1", label: "1 vs 1" },
                  { value: "2v2", label: "2 vs 2" },
                  { value: "3v3", label: "3 vs 3" },
                  { value: "4v4", label: "4 vs 4" },
                ]}
                onChange={handleTypeChange}
              />
            </Group>
          </Group>
        </Container>
        <Space h="md" />
        {error ? (
          <ErrorCard title="Error loading leaderboards" body={error} />
        ) : (
          <DataTable
            withTableBorder={true}
            borderRadius="md"
            highlightOnHover
            striped
            verticalSpacing={4}
            fz="sm"
            minHeight={300}
            idAccessor="statgroup_id"
            records={leaderBoardData || []}
            page={calculatePageNumber(start, RECORD_PER_PAGE)}
            totalRecords={totalRecords}
            recordsPerPage={RECORD_PER_PAGE}
            onPageChange={onPageChange}
            fetching={loading}
            columns={[
              {
                accessor: "rank",
                title: "Rank",
                textAlign: "center",
                render: ({ rank, regionrank }) => {
                  return region ? `${regionrank}` : `${rank}`;
                },
              },
              {
                accessor: "rating",
                title: "ELO",
                textAlign: "center",
              },
              {
                accessor: "tier",
                title: "Tier",
                textAlign: "center",
                render: ({ rank, rating, regionrank }) => {
                  return <RankIcon size={28} rank={region ? regionrank : rank} rating={rating} />;
                },
              },
              {
                accessor: "alias",
                title: "Alias",
                width: "100%",
                render: ({ members }) => {
                  return members.map((member: any) => {
                    const { alias, profile_id, country } = member;

                    return (
                      <Anchor
                        key={profile_id}
                        onClick={() => openLink(coh3statsPlayerProfile(profile_id))}
                      >
                        <Group gap="xs">
                          {country && (
                            <Image
                              src={`/flags/4x3/${country}.svg`}
                              alt={country}
                              w={18}
                              h={14}
                            />
                          )}
                          {alias}
                        </Group>
                      </Anchor>
                    );
                  });
                },
              },
              {
                accessor: "streak",
                title: "Streak",
                textAlign: "center",
                render: ({ streak }) => {
                  return streak > 0 ? (
                    <Text c="green">+{streak}</Text>
                  ) : (
                    <Text c="red">{streak}</Text>
                  );
                },
              },
              {
                accessor: "wins",
                title: "Wins",
                textAlign: "center",
              },
              {
                accessor: "losses",
                title: "Losses",
                textAlign: "center",
              },
              {
                accessor: "ratio",
                title: "Ratio",
                textAlign: "center",
                render: ({ wins, losses }) => {
                  return `${Math.round((wins / (wins + losses)) * 100)}%`;
                },
              },
              {
                accessor: "total",
                title: "Total",
                textAlign: "center",
                render: ({ wins, losses }) => {
                  return `${wins + losses}`;
                },
              },
            ]}
          />
        )}
      </Container>
    </Box>
  );
};
