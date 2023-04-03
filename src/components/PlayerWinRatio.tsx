import { Text, Tooltip } from "@mantine/core"
import React from "react"

export interface PlayerWinRatioProps {
  wins: unknown
  losses: unknown
}

export const PlayerWinRatio: React.FC<PlayerWinRatioProps> = ({
  wins,
  losses,
}) => {
  let content = "-"
  if (
    wins !== undefined &&
    wins !== null &&
    losses !== undefined &&
    losses !== null
  ) {
    const winsNumber = Number(wins)
    const lossesNumber = Number(losses)
    if (
      !isNaN(winsNumber) &&
      winsNumber >= 0 &&
      !isNaN(lossesNumber) &&
      lossesNumber >= 0 &&
      lossesNumber + winsNumber > 0
    ) {
      content =
        ((winsNumber / (winsNumber + lossesNumber)) * 100).toFixed(0) + "%"
    }
  }
  return (
    <>
      <Tooltip label="Win Ratio">
        <Text>{content}</Text>
      </Tooltip>
    </>
  )
}
