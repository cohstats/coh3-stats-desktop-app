import { Outlet } from "react-router-dom"
import { WindowTitleBar } from "./WindowTitleBar"

export const Root: React.FC = () => {
  return (
    <>
      <WindowTitleBar>
        <Outlet />
      </WindowTitleBar>
    </>
  )
}
