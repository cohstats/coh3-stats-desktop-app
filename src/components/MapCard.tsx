import { Card, Title, Image, Paper } from "@mantine/core"
import { getMapName, getMapsUrlOnCDN } from "../utils/utils"
import {
  GameDataTypes,
  MapViewSettings,
} from "../game-data-provider/GameData-types"
import { useMapViewSettings } from "../game-data-provider/configValues"

interface MapCardProps {
  gameData: GameDataTypes
}

const MapCard: React.FC<MapCardProps> = ({ gameData }) => {
  const [mapViewSettings, setMapViewSettings] = useMapViewSettings()

  if (!gameData) return null

  return (
    <Paper pl={"xs"} w="auto" h="320">
      <Title order={3}>Map - {getMapName(gameData.gameData.map)}</Title>
      <Image
        p="xs"
        w="auto"
        h="270"
        // fit="contain"
        fallbackSrc={
          getMapsUrlOnCDN(gameData.gameData.map, "none") ||
          "icons/placeholder.svg"
        }
        src={getMapsUrlOnCDN(
          gameData.gameData.map,
          mapViewSettings as MapViewSettings
        )}
        alt={gameData.gameData.map}
      />
    </Paper>
  )
}

export default MapCard
