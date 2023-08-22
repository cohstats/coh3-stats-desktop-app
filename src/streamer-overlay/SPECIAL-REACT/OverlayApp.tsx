import React from "react"
import { FullGameData } from "../../game-data-provider/GameData"
import { PlayerEntry } from "./PlayerEntry"

export interface OverlayAppProps {
  gameData: FullGameData
  flags: boolean
  alwaysVisible: boolean
}

// gameData.state === "Loading" || gameData.state === "InGame"

/**
 * You cannot use mantine here!
 * This react component is meant for the streamerOverlay where only inline styles work!
 */
export const OverlayApp: React.FC<OverlayAppProps> = ({
  gameData,
  flags,
  alwaysVisible,
}) => {
  return (
    <>
      {alwaysVisible ||
      gameData.state === "Loading" ||
      gameData.state === "InGame" ? (
        <div
          className={"coh3stats-overlay"}
        >
          <div
            className={"coh3stats-overlay-left"}
          >
            {gameData.left.players.map((player, index) => (
              <PlayerEntry
                key={player.relicID + "_" + index}
                playerData={player}
                flags={flags}
              />
            ))}
          </div>
          <div
            className={"coh3stats-overlay-right"}
          >
            {gameData.right.players.map((player, index) => (
              <PlayerEntry
                key={player.relicID + "_" + index}
                playerData={player}
                flags={flags}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
