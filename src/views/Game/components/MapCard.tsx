import { Title, Image, Paper } from "@mantine/core";
import { getMapName, getMapsUrlOnCDN } from "../../../utils/utils";
import { GameDataTypes, MapViewSettings } from "../../../game-data-provider/GameData-types";
import { useMapViewSettings } from "../../../game-data-provider/configValues";
import { useContext } from "react";
import { MapStatsContext } from "../../../providers/MapStatsProvider";

interface MapCardProps {
  gameData: GameDataTypes;
}

const MapCard: React.FC<MapCardProps> = ({ gameData }) => {
  const { data } = useContext(MapStatsContext);
  const [mapViewSettings] = useMapViewSettings();

  if (!gameData) return null;

  let fallBackSrc = getMapsUrlOnCDN(gameData.gameData.map, "none");

  if (getMapName(gameData.gameData.map, data) === gameData.gameData.map) {
    // This means we don't have a name for this map, most likely we don't have custom image for it
    fallBackSrc = "icons/placeholder.svg";
  }

  return (
    <Paper pl={"xs"} w="auto" h="320">
      <Title order={3}>Map - {getMapName(gameData.gameData.map, data)}</Title>
      <Image
        p="xs"
        w="auto"
        h="270"
        // fit="contain"
        fallbackSrc={fallBackSrc}
        src={getMapsUrlOnCDN(gameData.gameData.map, mapViewSettings as MapViewSettings)}
        alt={gameData.gameData.map}
      />
    </Paper>
  );
};

export default MapCard;
