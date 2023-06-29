import { useEffect, useState } from "react"
import { Badge, Group, Tooltip } from "@mantine/core"
import { getNumberOfOnlinePlayersSteamUrl } from "../utils/steam-api"
import { fetch } from "@tauri-apps/api/http"
import { SteamIcon } from "./other/Steam-icon"

export const OnlinePlayers: React.FC = () => {
  const [onlinePlayersData, setOnlinePlayersData] = useState<null | {
    playerCount: number
    timeStampMs: number
  }>(null)

  useEffect(() => {
    ;(async () => {
      try {
        if (
          (onlinePlayersData &&
            onlinePlayersData.timeStampMs <
              new Date().getTime() - 1000 * 60 * 4) ||
          !onlinePlayersData
        ) {
          const fetchResponse = await fetch(getNumberOfOnlinePlayersSteamUrl())
          // @ts-ignore
          const { response } = fetchResponse.data
          setOnlinePlayersData({
            playerCount: response.player_count,
            timeStampMs: new Date().getTime(),
          })
        }

        // Update the data every 5 minutes
        const intervalId = setInterval(async () => {
          try {
            if (
              (onlinePlayersData &&
                onlinePlayersData.timeStampMs <
                  new Date().getTime() - 1000 * 60 * 4) ||
              !onlinePlayersData
            ) {
              const fetchResponse = await fetch(
                getNumberOfOnlinePlayersSteamUrl()
              )
              // @ts-ignore
              const { response } = fetchResponse.data
              setOnlinePlayersData({
                playerCount: response.player_count,
                timeStampMs: new Date().getTime(),
              })
            }
          } catch (e) {
            console.error(e)
          }
        }, 1000 * 60 * 5)

        return () => {
          clearInterval(intervalId)
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  return (
    <Tooltip
      label={`Amount of online Steam players in Company of Heroes 3 as of ${new Date(
        onlinePlayersData?.timeStampMs || ""
      ).toLocaleString()}`}
      multiline
      width={200}
      withArrow
    >
      <div>
        <Group spacing={6}>
          <SteamIcon size={20} />
          Players in game
          <Badge
            color="green"
            variant="filled"
            size="md"
            style={{ minWidth: 60, marginBottom: -1 }}
          >
            {onlinePlayersData?.playerCount}
          </Badge>
        </Group>
      </div>
    </Tooltip>
  )
}
