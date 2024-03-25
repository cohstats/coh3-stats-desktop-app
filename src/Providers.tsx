import { MantineProvider, localStorageColorSchemeManager } from "@mantine/core"
import { GameDataProvider } from "./game-data-provider/GameDataProvider"
import { Notifications } from "@mantine/notifications"

interface ProvidersProps {
  children?: React.ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const colorSchemeManager = localStorageColorSchemeManager({
    key: "mantine-color-scheme",
  })

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
        <GameDataProvider>{children}</GameDataProvider>
      </MantineProvider>
    </>
  )
}
