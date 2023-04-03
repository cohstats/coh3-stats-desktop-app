import { MantineColor, Text, Tooltip } from "@mantine/core"
import React from "react"

export interface PlayerWinsProps {
  wins: unknown
}

export const PlayerWins: React.FC<PlayerWinsProps> = ({ wins }) => {
  let content = "-"
  let color: MantineColor | undefined
  if (wins !== undefined && wins !== null) {
    const winsNumber = Number(wins)
    if (!isNaN(winsNumber) && winsNumber >= 0) {
      content = winsNumber + "W"
      color = "green"
    }
  }
  return (
    <>
      <Tooltip label="Wins">
        <Text color={color}>{content}</Text>
      </Tooltip>
    </>
  )
}
