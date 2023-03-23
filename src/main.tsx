import React from "react"
import ReactDOM from "react-dom/client"
import { Providers } from "./Providers"
import { Router } from "./Router"
import { renderStreamerHTML } from "./streamer-overlay/renderStreamerOverlay"
import events from "./mixpanel/mixpanel"

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <Providers>
            <Router />
        </Providers>
    </React.StrictMode>
)
