import React from "react";
import ReactDOM from "react-dom/client";
import { Providers } from "./Providers";
import { Router } from "./Router";
import { renderStreamerHTML } from "./streamer-overlay/renderStreamerOverlay";
import events from "./mixpanel/mixpanel";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { info } from "@tauri-apps/plugin-log";
import * as Sentry from "@sentry/react";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "mantine-datatable/styles.layer.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { mountGameOverlay } from "./views/GameOverlay/mountGameOverlay";
import { GAME_OVERLAY_WINDOW_LABEL } from "./views/GameOverlay/types";

const root = document.getElementById("root") as HTMLElement;

// The in-game overlay is a second webview window on the same index.html. It must NOT
// go through Providers/Router: GameDataProvider would start a second log-file poll,
// duplicate every Relic API call and race the main window writing streamerOverlay.html.
// It renders from the data pushed to it over events and nothing else.
if (getCurrentWebviewWindow().label === GAME_OVERLAY_WINDOW_LABEL) {
  mountGameOverlay(root);
} else {
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

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <Providers>
          <Router />
        </Providers>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
