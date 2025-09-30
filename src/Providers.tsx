import { MantineProvider, localStorageColorSchemeManager } from "@mantine/core";
import { GameDataProvider } from "./game-data-provider/GameDataProvider";
import { Notifications } from "@mantine/notifications";
import { MapStatsProvider } from "./providers/MapStatsProvider";
import { SteamOnlinePlayersProvider } from "./providers/SteamOnlinePlayersProvider";

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
        <SteamOnlinePlayersProvider>
          <MapStatsProvider>
            <GameDataProvider>{children}</GameDataProvider>
          </MapStatsProvider>
        </SteamOnlinePlayersProvider>
      </MantineProvider>
    </>
  );
};
