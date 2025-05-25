import { Group, Text, Tooltip, Image, Anchor } from "@mantine/core";
import React from "react";
import { open } from "@tauri-apps/api/shell";
import { raceIDs } from "../../../utils/match-helpers";
import { coh3statsPlayerProfile } from "../../../utils/external-routes";

// Simplified player report interface based on our ProcessedMatch structure
interface PlayerReport {
  profile_id: number;
  race_id: number;
  resulttype: number;
  profile: {
    alias: string;
    country?: string;
  };
  matchhistorymember: {
    oldrating: number;
    newrating: number;
    wins: number;
    losses: number;
  };
}

interface RenderPlayersProps {
  playerReports: Array<PlayerReport>;
  profileID: number | string;
  matchType: number;
  renderFlag: boolean;
}

const RenderPlayer = ({
  playerInfo,
  profileID,
  matchType,
  renderFlag,
}: {
  playerInfo: PlayerReport;
  profileID: number | string;
  matchType: number;
  renderFlag: boolean;
}) => {
  const isCustomGame = matchType === 0;
  const matchHistory = playerInfo.matchhistorymember;

  let ratingPlayedWith: string | React.ReactElement = `${matchHistory.oldrating}`;
  const ratingChange = matchHistory.newrating - matchHistory.oldrating;

  let ratingChangeAsElement =
    ratingChange > 0 ? (
      <Text span c={"green"} fz={"sm"}>
        +{ratingChange}
      </Text>
    ) : ratingChange < 0 ? (
      <Text span c={"red"} fz={"sm"}>
        {ratingChange}
      </Text>
    ) : (
      <Text span fz={"sm"}>
        {ratingChange}
      </Text>
    );

  // Custom games rating change doesn't make sense
  ratingChangeAsElement = isCustomGame ? <></> : ratingChangeAsElement;

  // Check for unranked
  const isUnranked = matchHistory.losses + matchHistory.wins < 10;
  if (isUnranked) {
    ratingPlayedWith = (
      <Tooltip
        withArrow
        multiline
        style={{ maxWidth: "30ch" }}
        label={"Player is un-ranked in this mode.\n Have less than 10 games."}
      >
        <Text c={"dimmed"} size={"sm"}>
          N/A
        </Text>
      </Tooltip>
    );
  }

  // Check for custom games
  if (isCustomGame) {
    ratingPlayedWith = (
      <Tooltip
        withArrow
        multiline
        style={{ maxWidth: "30ch" }}
        label={"ELO displayed in custom games is not accurate. Custom games doesn't affect ELO."}
      >
        <span>{matchHistory.oldrating}*</span>
      </Tooltip>
    );
  }

  const ratingElement = (
    <>
      <span style={{ width: "4ch", textAlign: "left" }}>{ratingPlayedWith}</span>
      <span>{ratingChangeAsElement}</span>
    </>
  );

  const factionName = raceIDs[playerInfo.race_id as keyof typeof raceIDs] || "unknown";

  return (
    <div key={playerInfo.profile_id}>
      <Group gap={"6"}>
        <Image
          src={`/factions/${factionName}.webp`}
          alt={factionName}
          w={20}
          h={20}
          fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjY2NjIi8+Cjx0ZXh0IHg9IjEwIiB5PSIxNCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RjwvdGV4dD4KPC9zdmc+"
        />
        <> {ratingElement}</>
        <Text size={"sm"} span fw={`${playerInfo.profile_id}` === `${profileID}` ? 700 : 400}>
          <Group gap="xs">
            {renderFlag && playerInfo.profile.country && (
              <Image
                src={`/flags/4x3/${playerInfo.profile.country}.svg`}
                alt={playerInfo.profile.country}
                w={16}
                h={12}
                fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxNiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEyIiBmaWxsPSIjY2NjIi8+Cjx0ZXh0IHg9IjgiIHk9IjgiIGZvbnQtc2l6ZT0iOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Pz88L3RleHQ+Cjwvc3ZnPg=="
              />
            )}
            <Anchor
              onClick={() => open(coh3statsPlayerProfile(playerInfo.profile_id))}
              style={{ cursor: "pointer" }}
            >
              <Text truncate="end" size={"sm"} maw={120}>
                {playerInfo.profile.alias}
              </Text>
            </Anchor>
          </Group>
        </Text>
      </Group>
    </div>
  );
};

const RenderPlayers = ({
  playerReports,
  profileID,
  matchType,
  renderFlag = true,
}: RenderPlayersProps) => {
  return (
    <>
      {playerReports.map((playerInfo: PlayerReport) => {
        return (
          <RenderPlayer
            playerInfo={playerInfo}
            profileID={profileID}
            matchType={matchType}
            renderFlag={renderFlag}
            key={playerInfo.profile_id}
          />
        );
      })}
    </>
  );
};

export { RenderPlayers, RenderPlayer };
export default RenderPlayers;
