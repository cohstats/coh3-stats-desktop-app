import { ProcessedMatch } from "../../utils/data-types";
import {
  Button,
  CloseButton,
  Container,
  CopyButton,
  Drawer,
  Group,
  Space,
  TextInput,
  Text,
  Stack,
  Title,
  Flex,
} from "@mantine/core";
import React, { useContext } from "react";
import { IconCopy, IconCalendar, IconStopwatch, IconSwords } from "@tabler/icons-react";
import { open as openLink } from "@tauri-apps/plugin-shell";
import { coh3statsMatchDetail } from "../../utils/external-routes";
import {
  getMatchDuration,
  getMatchPlayersByFaction,
  matchTypesAsObject,
} from "../../utils/match-helpers";
import { processPlayerReports } from "../../utils/match-detail-helpers";
import MatchDetailsDataTable from "./match-details-data-table";
import { getMapName } from "../../utils/utils";
import { MapStatsContext } from "../../hooks/useMapStats";

const MatchDetailDrawer = ({
  selectedMatchRecord,
  opened,
  onClose,
}: {
  selectedMatchRecord: ProcessedMatch | null;
  opened: boolean;
  onClose: () => void;
}) => {
  const { data } = useContext(MapStatsContext);

  if (!selectedMatchRecord) {
    return null;
  }

  const fullRouteWithBase = coh3statsMatchDetail(
    selectedMatchRecord.id,
    selectedMatchRecord.matchhistoryreportresults.map((x) => x.profile_id),
  );

  // Get match type information
  const matchtype_id = selectedMatchRecord.matchtype_id;
  const matchType =
    matchTypesAsObject[matchtype_id as number]?.localizedName ||
    matchTypesAsObject[matchtype_id as number]?.name ||
    "unknown";

  // Get translated map name
  const mapDisplayName = getMapName(selectedMatchRecord.mapname, data);

  // Process player reports to ensure counters are parsed
  const processedPlayerReports = processPlayerReports(
    selectedMatchRecord.matchhistoryreportresults,
  );

  // Get players by faction
  const axisPlayers = getMatchPlayersByFaction(processedPlayerReports, "axis");
  const alliesPlayers = getMatchPlayersByFaction(processedPlayerReports, "allies");

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="90%"
      withCloseButton={false}
      position="bottom"
    >
      <Container size="xl" pl={0} pr={0}>
        <Group justify="space-between">
          <Group>
            <Button onClick={() => openLink(fullRouteWithBase)}>Open In Browser</Button>
            <CopyButton value={fullRouteWithBase}>
              {({ copied, copy }) => (
                <>
                  {copied ? (
                    <Button color="green" w={250}>
                      URL Copied to Clipboard
                    </Button>
                  ) : (
                    <TextInput
                      w={250}
                      value={fullRouteWithBase}
                      rightSection={<IconCopy size={16} />}
                      onClick={() => {
                        copy();
                      }}
                      readOnly
                    />
                  )}
                </>
              )}
            </CopyButton>
          </Group>
          <CloseButton onClick={onClose} size="lg" />
        </Group>
        <Space h="md" />

        {/* Match Header */}
        <Flex justify="space-between" wrap="wrap" mb="md">
          <Title order={2}>
            Match Detail - {matchType} - {mapDisplayName}
          </Title>
          <Stack gap="0">
            <Text size="sm" span>
              Played on {new Date(selectedMatchRecord.startgametime * 1000).toLocaleString()}{" "}
              <IconCalendar size={20} style={{ marginBottom: -3 }} />
            </Text>
            <Text size="sm" span ta="right">
              For{" "}
              {getMatchDuration(
                selectedMatchRecord.startgametime,
                selectedMatchRecord.completiontime,
              )}{" "}
              <IconStopwatch size={20} style={{ marginBottom: -3 }} />
            </Text>
          </Stack>
        </Flex>

        {/* Player Data Tables */}
        <Stack gap="md">
          {axisPlayers.length > 0 && <MatchDetailsDataTable data={axisPlayers} />}

          {axisPlayers.length > 0 && alliesPlayers.length > 0 && (
            <Flex justify="center" align="center" my={"xs"}>
              <IconSwords size={30} />
            </Flex>
          )}

          {alliesPlayers.length > 0 && <MatchDetailsDataTable data={alliesPlayers} />}
        </Stack>
      </Container>
    </Drawer>
  );
};

export default MatchDetailDrawer;
