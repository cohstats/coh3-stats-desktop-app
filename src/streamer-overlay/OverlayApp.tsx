import { MantineProvider } from "@mantine/styles"
import React from "react"
import { FullGameData } from "../game-data-provider/GameData"
import { PlayerEntry } from "./PlayerEntry"

export interface OverlayAppProps {
    gameData: FullGameData
}

export const OverlayApp: React.FC<OverlayAppProps> = ({ gameData }) => {
    return (
        <>
            {gameData.state === "Loading" || gameData.state === "InGame" ? (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "flex-start",
                        alignItems: "stretch",
                        position: "absolute",
                        left: "calc(calc(100vw / 2) - 450px)",
                        right: "calc(calc(100vw / 2) - 450px)",
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
                            />
                        ))}
                    </div>
                </div>
            ) : null}
        </>
    )
}
