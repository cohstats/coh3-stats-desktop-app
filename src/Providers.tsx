import { MantineProvider, localStorageColorSchemeManager } from "@mantine/core";
import { GameDataProvider } from "./game-data-provider/GameDataProvider";
import { Notifications } from "@mantine/notifications";
import { MapStatsProvider } from "./map-stats-provider";

interface ProvidersProps {
  children?: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: "mantine-color-scheme",
  });

  return (
    <>
      <MantineProvider
        // theme={{ colorScheme }}
        defaultColorScheme="dark"
        colorSchemeManager={colorSchemeManager}
        // withGlobalStyles
        // withNormalizeCSS
      >
        <Notifications />
        <MapStatsProvider>
          <GameDataProvider>{children}</GameDataProvider>
        </MapStatsProvider>
      </MantineProvider>
    </>
  );
};
