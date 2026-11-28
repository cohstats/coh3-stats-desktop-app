import React from "react";
import { FullPlayerData } from "../../game-data-provider/GameData-types";

export interface PlayerEntryProps {
  playerData: FullPlayerData;
  flags?: boolean;
}

/**
 * You cannot use mantine here!
 * This react component is meant for the streamerOverlay where only inline styles work!
 */
export const PlayerEntry: React.FC<PlayerEntryProps> = ({ playerData, flags = false }) => {
  return (
    <div className={"coh3stats-overlay-player"}>
      <img
        className={"coh3stats-overlay-player-factionIcon"}
        src={
          "https://raw.githubusercontent.com/cohstats/coh3-stats-desktop-app/master/public/factions/" +
          playerData.faction +
          ".webp"
        }
      />
      {flags ? (
        playerData.country ? (
          <img
            className={"coh3stats-overlay-player-flagIcon"}
            src={
              "https://raw.githubusercontent.com/cohstats/coh3-stats-desktop-app/master/public/flags/4x3/" +
              playerData.country +
              ".svg"
            }
          />
        ) : (
          // AI players (and players whose stats failed to load) have no country.
          // Keep an empty slot of the same size so the rows stay aligned.
          <span
            className={"coh3stats-overlay-player-flagIcon coh3stats-overlay-player-flagEmpty"}
          />
        )
      ) : null}
      <span className={"coh3stats-overlay-player-rank"}>
        {playerData.rank === undefined || playerData.rank === -1 ? "-" : "#" + playerData.rank}
      </span>{" "}
      <span className={"coh3stats-overlay-player-rating"}>
        {playerData.rating === undefined || playerData.rating === -1 ? "-" : playerData.rating}
      </span>{" "}
      <span className={"coh3stats-overlay-player-name"}>{playerData.name}</span>
    </div>
  );
};
