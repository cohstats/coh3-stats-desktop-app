import { Button, Code, ScrollArea, Text, Title } from "@mantine/core";
import React, { useContext } from "react";
import { showNotification } from "../utils/notifications";
import { getTeamDetails } from "../utils/coh3-stats-api";
import { MapStatsContext } from "../providers/MapStatsProvider";

export const Debug: React.FC = () => {
  const { data, loading, error } = useContext(MapStatsContext);

  return (
    <>
      This is the debug page, you should see this only in development mode.
      <br />
      Mode: {process.env.NODE_ENV}
      <br />
      <Button
        onClick={() => {
          showNotification({
            title: "Hello",
            message: "This is a notification",
            type: "success",
            autoCloseInMs: 5000,
          });
        }}
      >
        Show notifications
      </Button>
      <Button
        // Some older versions of request had problems with brotli encoding
        onClick={async () => {
          console.log(await getTeamDetails("allies-356993-371892"));
        }}
      >
        Get Team Details - check console - encoding issues
      </Button>
      <br />
      <br />
      <Title order={4}>Map Stats</Title>
      {loading && <Text>Loading map stats...</Text>}
      {error && <Text c="red">Error: {error}</Text>}
      {data && (
        <ScrollArea h={400}>
          <Code block>{JSON.stringify(data, null, 2)}</Code>
        </ScrollArea>
      )}
    </>
  );
};
