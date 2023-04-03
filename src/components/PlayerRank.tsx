import { Text, Tooltip } from "@mantine/core"
import React from "react"

export interface PlayerRankProps {
  rank: unknown
}

export const PlayerRank: React.FC<PlayerRankProps> = ({ rank }) => {
  let content = "-"
  if (rank !== undefined && rank !== null) {
    const rankNumber = Number(rank)
    if (!isNaN(rankNumber) && rankNumber > -1) {
      content = "#" + rankNumber
    }
  }
  return (
    <>
      <Tooltip label="Rank">
        <Text>{content}</Text>
      </Tooltip>
    </>
  )
}
