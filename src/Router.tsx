import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { About } from "./views/About"
import { Game } from "./views/Game"
import { Root } from "./views/Root"
import { Settings } from "./views/Settings"
import { Replays } from "./views/Replays"
import { Debug } from "./views/Debug"
import {
  AboutErrorBoundary,
  GameErrorBoundary,
  ReplaysErrorBoundary,
  SettingsErrorBoundary,
} from "./components/ErrorBoundary"

export enum Routes {
  GAME = "/",
  SETTINGS = "/settings",
  ABOUT = "/about",
  REPLAYS = "/replays",
  DEBUG = "/debug",
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: Routes.GAME,
        element: (
          <GameErrorBoundary>
            <Game />
          </GameErrorBoundary>
        ),
      },
      {
        path: Routes.SETTINGS,
        element: (
          <SettingsErrorBoundary>
            <Settings />
          </SettingsErrorBoundary>
        ),
      },
      {
        path: Routes.REPLAYS,
        element: (
          <ReplaysErrorBoundary>
            <Replays />
          </ReplaysErrorBoundary>
        ),
      },
      {
        path: Routes.ABOUT,
        element: (
          <AboutErrorBoundary>
            <About />
          </AboutErrorBoundary>
        ),
      },
      {
        path: Routes.DEBUG,
        element: <Debug />,
      },
    ],
  },
])

export const Router: React.FC = () => <RouterProvider router={router} />
