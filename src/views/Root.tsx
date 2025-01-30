import { Outlet } from "react-router";
import { WindowTitleBar } from "../WindowTitleBar";

export const Root: React.FC = () => {
  return (
    <>
      <WindowTitleBar>
        <Outlet />
      </WindowTitleBar>
    </>
  );
};
