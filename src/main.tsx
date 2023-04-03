import React from "react"
import ReactDOM from "react-dom/client"
import { Providers } from "./Providers"
import { Router } from "./Router"
import { renderStreamerHTML } from "./streamer-overlay/renderStreamerOverlay"
import events from "./mixpanel/mixpanel"
import { listen } from "@tauri-apps/api/event"
import { appWindow } from "@tauri-apps/api/window"
import { trace, info, error, attachConsole } from "tauri-plugin-log-api"

info("Start frontend")

events.init()

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
})

listen("single-instance", () => {
  //appWindow.requestUserAttention(2)
  //appWindow.setFocus()
})

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Providers>
      <Router />
    </Providers>
  </React.StrictMode>
)
