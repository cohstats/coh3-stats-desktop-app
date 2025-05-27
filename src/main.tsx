import React from "react";
import ReactDOM from "react-dom/client";
import { Providers } from "./Providers";
import { Router } from "./Router";
import { renderStreamerHTML } from "./streamer-overlay/renderStreamerOverlay";
import events from "./mixpanel/mixpanel";
import { listen } from "@tauri-apps/api/event";
import { info } from "tauri-plugin-log-api";
import { UploadNotifications } from "./components/UploadNotifications";
import * as Sentry from "@sentry/react";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "mantine-datatable/styles.layer.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

info("Start frontend");

Sentry.init({
  dsn: "https://88e8a309f91b8b5bb9a41dd14ff775b9@o4504995920543744.ingest.sentry.io/4506752563019776",
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
  tracePropagationTargets: [],
  ignoreErrors: ["window.__TAURI_IPC__ is not a function"],
  beforeSend(event, hint) {
    // On macOS we do only development, we can ignore all development errors
    if (event.contexts?.os?.name === "macOS") {
      // Ignore the event
      return null;
    }
    // Otherwise, return the event as is
    return event;
  },
});

events.init();

// make sure an html file exists
renderStreamerHTML({
  uniqueID: "",
  state: "Closed",
  type: "Classic",
  timestamp: "",
  duration: 0,
  map: "",
  winCondition: "",
  left: {
    players: [],
    side: "Mixed",
  },
  right: {
    players: [],
    side: "Mixed",
  },
  language_code: "",
});

listen("single-instance", () => {
  //appWindow.requestUserAttention(2)
  //appWindow.setFocus()
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Providers>
        <UploadNotifications />
        <Router />
      </Providers>
    </ErrorBoundary>
  </React.StrictMode>,
);
