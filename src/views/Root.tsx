import { Outlet, useNavigate, useLocation } from "react-router";
import { WindowTitleBar } from "../WindowTitleBar";
import { setNavigationHelpers } from "../utils/navigation";
import { useEffect } from "react";

export const Root: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initialize navigation helpers so they can be used outside Router context
    setNavigationHelpers(navigate, () => location.pathname);
  }, [navigate, location.pathname]);

  return (
    <>
      <WindowTitleBar>
        <Outlet />
      </WindowTitleBar>
    </>
  );
};
