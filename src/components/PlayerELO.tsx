import { Text, Tooltip } from "@mantine/core"
import React from "react"

export interface PlayerELOProps {
  rating: unknown
}

export const PlayerELO: React.FC<PlayerELOProps> = ({ rating }) => {
  let content = "-"
  if (rating !== undefined && rating !== null) {
    const ratingNumber = Number(rating)
    if (!isNaN(ratingNumber) && ratingNumber > -1) {
      content = "" + ratingNumber
    }
  }
  return (
    <>
      <Tooltip label="ELO">
        <Text>{content}</Text>
      </Tooltip>
    </>
  )
}
