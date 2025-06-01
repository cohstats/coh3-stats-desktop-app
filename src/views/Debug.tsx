import { Button } from "@mantine/core";
import React from "react";
import { showNotification } from "../utils/notifications";
import { getTeamDetails } from "../utils/coh3-stats-api";

export const Debug: React.FC = () => {
  return (
    <>
      This is the debug page, you shoulld see this only in development mode.
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
        onClick={async () => {
          console.log(await getTeamDetails("allies-356993-371892"));
        }}
      >
        Get Team Details - check console - br issue
      </Button>
    </>
  );
};
