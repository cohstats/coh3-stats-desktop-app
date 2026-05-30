import { Box, Text, Anchor, Paper, Title, Stack } from "@mantine/core";
import { useEffect } from "react";
import { open as openLink } from "@tauri-apps/plugin-shell";
import events from "../mixpanel/mixpanel";
import { COHDBIcon } from "../components/other/COHDB-icon";
import config from "../config";

export const Replays: React.FC = () => {
  useEffect(() => {
    events.open_replays().then();
  }, []);

  return (
    <Box p="xl" pt={"md"}>
      <Paper p="md">
        <Stack gap="md">
          <Title order={3}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <COHDBIcon size={24} /> Replay Analysis
            </span>
          </Title>
          <Text size="lg" data-testid="replays-description">
            Visit{" "}
            <Anchor onClick={() => openLink(config.COHDB_BASE_URL)} fw={700}>
              cohdb.com
            </Anchor>{" "}
            to upload and analyze your Company of Heroes 3 replays.
          </Text>
          <Text>
            COHDB offers comprehensive replay analysis tools to help you improve your gameplay and
            review your matches.
          </Text>
          <Text>
            You can also visit{" "}
            <Anchor onClick={() => openLink("https://coh3stats.com")} fw={700}>
              coh3stats.com
            </Anchor>{" "}
            for additional stats and leaderboards.
          </Text>
        </Stack>
      </Paper>
    </Box>
  );
};
