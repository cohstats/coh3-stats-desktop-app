import { MantineColor, Text, Tooltip } from "@mantine/core"
import React from "react"

export interface PlayerLossesProps {
  losses: unknown
}

export const PlayerLosses: React.FC<PlayerLossesProps> = ({ losses }) => {
  let content = "-"
  let color: MantineColor | undefined
  if (losses !== undefined && losses !== null) {
    const lossesNumber = Number(losses)
    if (!isNaN(lossesNumber) && lossesNumber >= 0) {
      content = lossesNumber + "L"
      color = "red"
    }
  }
  return (
    <>
      <Tooltip label="Losses">
        <Text color={color}>{content}</Text>
      </Tooltip>
    </>
  )
}
