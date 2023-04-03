import {
  MantineProvider,
  ColorScheme,
  ColorSchemeProvider,
} from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { useState } from "react"
import { GameDataProvider } from "./game-data-provider/GameDataProvider"

interface ProvidersProps {
  children?: React.ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "dark",
    getInitialValueInEffect: true,
  })

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"))
  return (
    <>
      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
      >
        <MantineProvider
          theme={{ colorScheme }}
          withGlobalStyles
          withNormalizeCSS
        >
          <GameDataProvider>{children}</GameDataProvider>
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  )
}
