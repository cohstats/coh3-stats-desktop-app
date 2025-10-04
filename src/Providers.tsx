import { MantineProvider, localStorageColorSchemeManager } from "@mantine/core";
import { GameDataProvider } from "./game-data-provider/GameDataProvider";
import { Notifications } from "@mantine/notifications";
import { MapStatsProvider } from "./providers/MapStatsProvider";
import { SteamOnlinePlayersProvider } from "./providers/SteamOnlinePlayersProvider";
import { useFontScale } from "./config-store/fontScaleConfig";
import { FontScaleInjector } from "./providers/FontScaleInjector";
import { UpdaterProvider } from "./providers/UpdaterProvider";

interface ProvidersProps {
  children?: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: "mantine-color-scheme",
  });
  const [fontScale] = useFontScale();

  // Determine input size based on font scale
  const inputSize = fontScale && fontScale < 1 ? "xs" : "sm";
  const actionIconSize = fontScale && fontScale < 1 ? "md" : "lg";

  return (
    <>
      <MantineProvider
        defaultColorScheme="dark"
        colorSchemeManager={colorSchemeManager}
        theme={{
          fontSizes: {
            xs: `calc(0.75rem * ${fontScale ?? 1})`,
            sm: `calc(0.875rem * ${fontScale ?? 1})`,
            md: `calc(1rem * ${fontScale ?? 1})`,
            lg: `calc(1.125rem * ${fontScale ?? 1})`,
            xl: `calc(1.25rem * ${fontScale ?? 1})`,
          },
          headings: {
            sizes: {
              h1: { fontSize: `calc(2.125rem * ${fontScale ?? 1})` },
              h2: { fontSize: `calc(1.625rem * ${fontScale ?? 1})` },
              h3: { fontSize: `calc(1.375rem * ${fontScale ?? 1})` },
              h4: { fontSize: `calc(1.125rem * ${fontScale ?? 1})` },
              h5: { fontSize: `calc(1rem * ${fontScale ?? 1})` },
              h6: { fontSize: `calc(0.875rem * ${fontScale ?? 1})` },
            },
          },
          components: {
            ActionIcon: {
              defaultProps: {
                size: actionIconSize,
              },
            },
            Button: {
              defaultProps: {
                size: inputSize,
              },
            },
            Select: {
              defaultProps: {
                size: inputSize,
              },
            },
            TextInput: {
              defaultProps: {
                size: inputSize,
              },
            },
            Input: {
              defaultProps: {
                size: inputSize,
              },
            },
            Textarea: {
              defaultProps: {
                size: inputSize,
              },
            },
            NumberInput: {
              defaultProps: {
                size: inputSize,
              },
            },
            PasswordInput: {
              defaultProps: {
                size: inputSize,
              },
            },
            Checkbox: {
              defaultProps: {
                size: inputSize,
              },
            },
            Radio: {
              defaultProps: {
                size: inputSize,
              },
            },
            Switch: {
              defaultProps: {
                size: inputSize,
              },
            },
          },
        }}
      >
        <FontScaleInjector />
        <Notifications />
        <UpdaterProvider>
          <SteamOnlinePlayersProvider>
            <MapStatsProvider>
              <GameDataProvider>{children}</GameDataProvider>
            </MapStatsProvider>
          </SteamOnlinePlayersProvider>
        </UpdaterProvider>
      </MantineProvider>
    </>
  );
};
