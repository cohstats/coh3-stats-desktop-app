import { Button } from "@mantine/core";
import React from "react";
import { showNotification } from "../utils/notifications";

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
    </>
  );
};
