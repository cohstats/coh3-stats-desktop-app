import { Text, Tooltip, Image } from "@mantine/core";
import React, { useContext } from "react";
import { getMapName, getMapsUrlOnCDN } from "../../../utils/utils";
import { MapViewSettings } from "../../../game-data-provider/GameData-types";
import { useMapViewSettings } from "../../../game-data-provider/configValues";
import { MapStatsContext } from "../../../map-stats-provider";

const RenderMap = ({
  mapName,
  renderTitle,
  height,
  width,
}: {
  mapName: string;
  renderTitle?: boolean;
  height?: number;
  width?: number;
}) => {
  const { data } = useContext(MapStatsContext);
  const [mapViewSettings] = useMapViewSettings();

  renderTitle = renderTitle ?? true;

  // Set up fallback logic similar to MapCard.tsx
  let fallBackSrc = getMapsUrlOnCDN(mapName, "none");

  if (getMapName(mapName, data) === mapName) {
    // This means we don't have a name for this map, most likely we don't have custom image for it
    fallBackSrc = "icons/placeholder.svg";
  }

  return (
    <>
      <div style={{ width: "100%" }}>
        <Tooltip label={getMapName(mapName, data)}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Image
              p="xs"
              w="auto"
              // h={height ?? "100%"}
              fallbackSrc={fallBackSrc}
              src={getMapsUrlOnCDN(mapName, mapViewSettings as MapViewSettings)}
              alt={mapName}
              style={{
                maxWidth: width ?? "100%",
                borderRadius: "4px",
              }}
            />
          </div>
        </Tooltip>
        {renderTitle && (
          <Text style={{ textAlign: "center" }} size={"sm"}>
            {getMapName(mapName, data)}
          </Text>
        )}
      </div>
    </>
  );
};

export default RenderMap;
