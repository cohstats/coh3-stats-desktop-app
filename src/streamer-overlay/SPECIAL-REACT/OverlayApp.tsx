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
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignItems: "stretch",
            position: "absolute",
            left: "calc(calc(100vw / 2) - 485px)",
            right: "calc(calc(100vw / 2) - 485px)",
            top: 65,
          }}
        >
          <div
            style={{
              flexGrow: 1,
              flexBasis: 0,
              paddingRight: 40,
              paddingLeft: 10,
            }}
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
            style={{
              flexGrow: 1,
              flexBasis: 0,
              paddingLeft: 40,
              paddingRight: 10,
            }}
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
