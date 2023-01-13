import React from "react"
import ReactDOM from "react-dom/client"
import { Providers } from "./Providers"
import { Router } from "./Router"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <Providers>
            <Router />
        </Providers>
    </React.StrictMode>
)
