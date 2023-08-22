import React from "react"
import { FullPlayerData } from "../../game-data-provider/GameData"

export interface PlayerEntryProps {
  playerData: FullPlayerData
  flags?: boolean
}

/**
 * You cannot use mantine here!
 * This react component is meant for the streamerOverlay where only inline styles work!
 */
export const PlayerEntry: React.FC<PlayerEntryProps> = ({
  playerData,
  flags = false,
}) => {
  return (
    <div
      className={"coh3stats-overlay-player"}
    >
      <img
        className={"coh3stats-overlay-player-factionIcon"}
        src={
          "https://raw.githubusercontent.com/cohstats/coh3-stats-desktop-app/master/public/factions/" +
          playerData.faction +
          ".webp"
        }
      />
      {flags ? (
        <img
          className={"coh3stats-overlay-player-flagIcon"}
          src={
            "https://raw.githubusercontent.com/cohstats/coh3-stats-desktop-app/master/public/flags/4x3/" +
            playerData.country +
            ".svg"
          }
        />
      ) : null}
      <span
        className={"coh3stats-overlay-player-rank"}
      >
        {playerData.rank === undefined || playerData.rank === -1
          ? "-"
          : "#" + playerData.rank}
      </span>{" "}
      <span
        className={"coh3stats-overlay-player-rating"}
      >
        {playerData.rating === undefined || playerData.rating === -1
          ? "-"
          : playerData.rating}
      </span>{" "}
      <span
        className={"coh3stats-overlay-player-name"}
      >
        {playerData.name}
      </span>
    </div>
  )
}
