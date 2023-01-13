import { useGameData } from "./game-data-provider/GameDataProvider"
import { ColorSchemeToggle } from "coh-stats-components"
import { Box } from "@mantine/core"

export const Settings: React.FC = () => {
    return (
        <>
            <Box p="xl">
                Color Theme: <ColorSchemeToggle />
            </Box>
        </>
    )
}
