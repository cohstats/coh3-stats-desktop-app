import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { About } from "./About"
import { Game } from "./Game"
import { Root } from "./Root"
import { Settings } from "./Settings"

export enum Routes {
  GAME = "/",
  SETTINGS = "/settings",
  ABOUT = "/about",
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
        path: Routes.ABOUT,
        element: <About />,
      },
    ],
  },
])

export const Router: React.FC = () => <RouterProvider router={router} />
