import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { About } from "./views/About"
import { Game } from "./views/Game"
import { Root } from "./views/Root"
import { Settings } from "./views/Settings"
import { Replays } from "./views/Replays"
import { Debug } from "./views/Debug"

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
        element: <Game />,
      },
      {
        path: Routes.SETTINGS,
        element: <Settings />,
      },
      {
        path: Routes.REPLAYS,
        element: <Replays />,
      },
      {
        path: Routes.ABOUT,
        element: <About />,
      },
      {
        path: Routes.DEBUG,
        element: <Debug />,
      },
    ],
  },
])

export const Router: React.FC = () => <RouterProvider router={router} />
