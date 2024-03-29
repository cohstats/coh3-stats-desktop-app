import { Card, Title, Image, Space, Center, Flex } from "@mantine/core"
import { getMapName, getMapUrl } from "../utils/utils"
import { GameData, MapViewSettings } from "../game-data-provider/GameData"
import { useMapViewSettings } from "../game-data-provider/configValues"

interface MapCardProps {
  gameData: GameData
}

const MapCard: React.FC<MapCardProps> = ({ gameData }) => {
  const [mapViewSettings, setMapViewSettings] = useMapViewSettings()

  if (!gameData) return null

  return (
    <Card padding={"md"} w="300" h="320" withBorder shadow="xs">
      <Title order={4}>Map - {getMapName(gameData.gameData.map)}</Title>
      <Card.Section w="280" h="280" p="xs">
        <Image
          p="xs"
          w="auto"
          h="100%"
          fit="contain"
          fallbackSrc={
            getMapUrl(gameData.gameData.map, "none") || "icons/placeholder.svg"
          }
          src={getMapUrl(
            gameData.gameData.map,
            mapViewSettings as MapViewSettings
          )}
          alt="Map"
        />
      </Card.Section>
    </Card>
  )
}

export default MapCard
