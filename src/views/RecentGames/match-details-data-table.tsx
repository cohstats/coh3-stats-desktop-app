import React from "react";
import { DataTable, DataTableColumnGroup } from "mantine-datatable";
import { PlayerReport } from "../../utils/data-types";
import { Group, Image, Badge, Tooltip, Anchor, Text } from "@mantine/core";
import { getMatchDurationGameTime, getIconsPathOnCDN } from "../../utils/match-detail-helpers";
import { raceIDs } from "../../utils/match-helpers";
import { getFactionName } from "../../utils/renameLabels";
import { open } from "@tauri-apps/api/shell";
import { coh3statsPlayerProfile } from "../../utils/external-routes";
import { IconInfoCircle } from "@tabler/icons-react";

interface PlayerMatchesDataTableProps {
  data: PlayerReport[];
}

const MatchDetailsDataTable = ({ data }: PlayerMatchesDataTableProps) => {
  // Custom games might have no player data
  if (data.length === 0) {
    return <></>;
  }

  const tableGroups: DataTableColumnGroup<PlayerReport>[] = [
    {
      id: "playergroup",
      textAlign: "center",
      title: (
        <Group justify="center">
          {data[0].resulttype === 1 && (
            <Badge color={"blue"} variant="filled" w={"25ch"}>
              VICTORY
            </Badge>
          )}
          {data[0].resulttype === 0 && (
            <Badge color={"red"} variant="filled" w={"25ch"}>
              DEFEAT
            </Badge>
          )}
          {data[0].resulttype === 4 && (
            <Badge color={"gray"} variant="filled" w={"25ch"}>
              DE-SYNC
            </Badge>
          )}
          {data[0].resulttype !== 1 && data[0].resulttype !== 0 && data[0].resulttype !== 4 && (
            <Badge color={"gray"} variant="filled" w={"25ch"}>
              ERROR
            </Badge>
          )}
        </Group>
      ),
      columns: [
        {
          accessor: "playerName",
          title: <>&nbsp; Faction &nbsp; /&nbsp; ELO&nbsp; /&nbsp; Alias</>,
          width: 250,
          render: (record) => {
            const factionName = raceIDs[record.race_id] || "unknown";
            const displayFactionName = getFactionName(factionName);

            return (
              <Group gap="xs">
                <Tooltip label={displayFactionName}>
                  <Image
                    src={`/factions/${factionName}.webp`}
                    alt={factionName}
                    w={20}
                    h={20}
                    fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjY2NjIi8+Cjx0ZXh0IHg9IjEwIiB5PSIxNCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RjwvdGV4dD4KPC9zdmc+"
                  />
                </Tooltip>

                <div>{record.matchhistorymember.oldrating}</div>
                <div>
                  {(() => {
                    const ratingChange =
                      record.matchhistorymember.newrating - record.matchhistorymember.oldrating;

                    if (ratingChange > 0) {
                      return <span style={{ color: "#51cf66" }}>+{ratingChange}</span>;
                    } else if (ratingChange < 0) {
                      return <span style={{ color: "#ff6b6b" }}>{ratingChange}</span>;
                    } else {
                      return <span>0</span>;
                    }
                  })()}
                </div>
                <div>
                  <Anchor
                    onClick={() => open(coh3statsPlayerProfile(record.profile_id))}
                    style={{ cursor: "pointer" }}
                  >
                    {record.profile?.alias || `Player ${record.profile_id}`}
                  </Anchor>
                </div>
              </Group>
            );
          },
        },
      ],
    },
    {
      id: "dmgdone",
      title: "",
      columns: [
        {
          accessor: "dmgdone",
          title: "Damage Dealt",
          textAlign: "center",
          render: ({ counters }) => counters.dmgdone.toLocaleString(),
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.dmgdone, 0)
                .toLocaleString()}
            </div>
          ),
        },
      ],
    },
    {
      id: "units",
      title: (
        <Group gap={4} justify="center">
          <Image
            src={getIconsPathOnCDN(`/icons/races/common/symbols/building_barracks.webp`)}
            alt="Infantry"
            width={20}
            height={20}
            fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjY2NjIi8+Cjx0ZXh0IHg9IjEwIiB5PSIxNCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VTwvdGV4dD4KPC9zdmc+"
          />
          Units
        </Group>
      ),
      textAlign: "center",
      columns: [
        {
          accessor: "kd_ratio",
          title: "K / D",
          textAlign: "center",
          render: ({ counters }) => {
            const kills = counters.ekills;
            const deaths = counters.edeaths;
            return deaths !== 0 ? (kills / deaths).toFixed(2) : kills.toString();
          },
          footer: (
            <div style={{ textAlign: "center" }}>
              {(
                Object.values(data).reduce((acc, curr) => acc + curr.counters.ekills, 0) /
                Object.values(data).reduce((acc, curr) => acc + curr.counters.edeaths, 0)
              ).toFixed(2)}
            </div>
          ),
        },
        {
          accessor: "ekills",
          title: "Killed",
          textAlign: "center",
          render: ({ counters }) => counters.ekills ?? "N/A",
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.ekills, 0)
                .toLocaleString()}
            </div>
          ),
        },
        {
          accessor: "edeaths",
          title: "Lost",
          textAlign: "center",
          render: ({ counters }) => counters.edeaths ?? "N/A",
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.edeaths, 0)
                .toLocaleString()}
            </div>
          ),
        },
      ],
    },
    {
      id: "Squads",
      title: (
        <Group gap={"xs"} justify="center">
          <Image
            src={getIconsPathOnCDN("/icons/common/squad/squad.webp")}
            alt="Squads"
            width={20}
            height={20}
          />
          Squads
        </Group>
      ),
      textAlign: "center",
      columns: [
        {
          accessor: "sqkill",
          title: "Killed",
          textAlign: "center",
          render: ({ counters }) => counters.sqkill ?? "N/A",
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.sqkill, 0)
                .toLocaleString()}
            </div>
          ),
        },
        {
          accessor: "sqprod",
          title: "Made / Lost",
          textAlign: "center",
          render: ({ counters }) => `${counters.sqprod ?? "N/A"} / ${counters.sqlost ?? "N/A"}`,
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.sqprod, 0)
                .toLocaleString() +
                " / " +
                Object.values(data)
                  .reduce((acc, curr) => acc + curr.counters.sqlost, 0)
                  .toLocaleString()}
            </div>
          ),
        },
      ],
    },
    {
      id: "Vehicles",
      title: (
        <Group gap={"xs"} justify="center">
          <Image
            src={getIconsPathOnCDN(`/icons/races/common/symbols/building_tank_depot.webp`)}
            alt="vehicles"
            width={20}
            height={20}
            fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjY2NjIi8+Cjx0ZXh0IHg9IjEwIiB5PSIxNCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VjwvdGV4dD4KPC9zdmc+"
          />
          Vehicles
        </Group>
      ),
      textAlign: "center",
      columns: [
        {
          accessor: "vkill",
          title: "Killed",
          textAlign: "center",
          render: ({ counters }) => counters.vkill ?? "N/A",
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.vkill, 0)
                .toLocaleString()}
            </div>
          ),
        },
        {
          accessor: "vprod",
          title: "Made / Lost",
          textAlign: "center",
          render: ({ counters }) => `${counters.vprod ?? "N/A"} / ${counters.vlost ?? "N/A"}`,
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.vprod, 0)
                .toLocaleString() +
                " / " +
                Object.values(data)
                  .reduce((acc, curr) => acc + curr.counters.vlost, 0)
                  .toLocaleString()}
            </div>
          ),
        },
      ],
    },
    {
      id: "strategy-points",
      title: (
        <Group gap={"xs"} justify="center">
          <Image
            src={getIconsPathOnCDN(`10_retreatpoint`, "export_flatten")}
            alt="strategy points"
            width={15}
            height={15}
            fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUiIGhlaWdodD0iMTUiIHZpZXdCb3g9IjAgMCAxNSAxNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE1IiBoZWlnaHQ9IjE1IiBmaWxsPSIjY2NjIi8+Cjx0ZXh0IHg9IjcuNSIgeT0iMTEiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlA8L3RleHQ+Cjwvc3ZnPg=="
          />
          Strategy points
        </Group>
      ),
      textAlign: "center",
      columns: [
        {
          accessor: "pcap",
          title: "Captured / Lost",
          textAlign: "center",
          render: ({ counters }) => `${counters.pcap ?? "N/A"} / ${counters.plost ?? "N/A"}`,
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.pcap, 0)
                .toLocaleString() +
                " / " +
                Object.values(data)
                  .reduce((acc, curr) => acc + curr.counters.plost, 0)
                  .toLocaleString()}
            </div>
          ),
        },
        {
          accessor: "precap",
          title: "Recaptured",
          textAlign: "center",
          render: ({ counters }) => counters.precap ?? "N/A",
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.precap, 0)
                .toLocaleString()}
            </div>
          ),
        },
      ],
    },
    {
      id: "abil-used",
      title: "Abilities Used",
      textAlign: "center",
      columns: [
        {
          accessor: "abil",
          title: "Unit",
          textAlign: "center",
          render: ({ counters }) => counters.abil ?? "N/A",
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.abil, 0)
                .toLocaleString()}
            </div>
          ),
        },
        {
          accessor: "cabil",
          title: "BG",
          textAlign: "center",
          render: ({ counters }) => counters.cabil ?? "N/A",
          footer: (
            <div style={{ textAlign: "center" }}>
              {Object.values(data)
                .reduce((acc, curr) => acc + curr.counters.cabil, 0)
                .toLocaleString()}
            </div>
          ),
        },
      ],
    },
    {
      id: "time-commands",
      title: (
        <Tooltip
          label={
            <>
              <strong>Recaptured Strategy Points</strong> - When player neutralizes point, it's
              counted as recapture.
              <br />
              <strong>Game Time</strong> - Time spent in the game. If someone has less than the
              rest of the team, it means they left the game before end. <br />
              <strong>APM</strong> - Actions Per Minute. <br />
              <strong>BG</strong> - Battle Group <br />
            </>
          }
          withArrow
        >
          <IconInfoCircle size={22} />
        </Tooltip>
      ),
      textAlign: "right",
      columns: [
        {
          accessor: "totalcmds",
          title: (
            <Tooltip label="Actions Per Minute" withArrow>
              <span>APM</span>
            </Tooltip>
          ),
          textAlign: "center",
          render: (record) => {
            const gameTimeMinutes = record.counters.gt / 60;
            const commands = record.counters.totalcmds;
            const apm = gameTimeMinutes > 0 ? (commands / gameTimeMinutes).toFixed(0) : "0";

            return <>{apm}</>;
          },
          footer: (
            <div style={{ textAlign: "center" }}>
              {(() => {
                const totalCommands = Object.values(data).reduce(
                  (acc, curr) => acc + curr.counters.totalcmds,
                  0,
                );
                const GameTime = Object.values(data).reduce(
                  (acc, curr) => acc + curr.counters.gt,
                  0,
                );
                const averageAPM =
                  GameTime > 0 ? (totalCommands / (GameTime / 60)).toFixed(0) : "0";
                return (
                  <Tooltip label="Average Actions Per Minute" withArrow>
                    <span>{averageAPM}*</span>
                  </Tooltip>
                );
              })()}
            </div>
          ),
        },
        {
          accessor: "gt",
          title: "Game Time",
          textAlign: "center",
          render: ({ counters }) => (
            <>{counters.gt ? getMatchDurationGameTime(counters.gt) : "N/A"}</>
          ),
          footer: (
            <div style={{ textAlign: "center" }}>
              {getMatchDurationGameTime(
                Math.max(...Object.values(data).map((curr) => curr.counters.gt)),
              )}
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <Group gap={"1"} wrap="nowrap" align="stretch">
      <DataTable
        highlightOnHover
        withColumnBorders
        striped={true}
        records={[...data]}
        groups={tableGroups}
        withTableBorder={true}
        borderRadius="md"
        // this is used as key for react
        idAccessor={"profile.profile_id"}
        // xs is 10
        horizontalSpacing="7"
      />
    </Group>
  );
};

export default MatchDetailsDataTable;
