import { Box, Group } from "@mantine/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Link, useLocation } from "react-router";
import logo from "./assets/logo/32x32.png";
import { Routes } from "./Router";
import classes from "./WindowTitleBar.module.css";
import React, { useCallback } from "react";
import { saveWindowState, StateFlags } from "@tauri-apps/plugin-window-state";
import { OnlinePlayers } from "./components/Online-players";
import { GameState } from "./components/GameState";

export interface WindowTitleBarProps {
  children?: React.ReactNode;
}

export const WindowTitleBar: React.FC<WindowTitleBarProps> = ({ children }) => {
  const location = useLocation();
  const appWindow = getCurrentWebviewWindow();

  const handleMinimize = useCallback(async () => {
    try {
      console.log("minimize");
      await appWindow.minimize();
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  }, [appWindow]);

  const handleToggleMaximize = useCallback(async () => {
    try {
      await appWindow.toggleMaximize();
    } catch (error) {
      console.error("Failed to toggle maximize window:", error);
    }
  }, [appWindow]);

  const handleClose = useCallback(async () => {
    try {
      await saveWindowState(StateFlags.ALL);
      await appWindow.close();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  }, [appWindow]);

  return (
    <div className={classes.wrapper}>
      <div className={classes.header} data-tauri-drag-region>
        <Group justify="space-between" pl="xs" className={classes.titleBarGroup}>
          <Group gap={4} className={classes.navigationGroup}>
            <img src={logo} width={20} className={classes.logo} />
            <Link
              to={Routes.GAME}
              className={`${classes.link} ${classes.navLink} ${
                location.pathname === Routes.GAME ? classes.selectedLink : ""
              }`}
            >
              Game
            </Link>
            <Link
              to={Routes.RECENT_GAMES}
              className={`${classes.link} ${classes.navLink} ${
                location.pathname === Routes.RECENT_GAMES ? classes.selectedLink : ""
              }`}
            >
              Recent Games
            </Link>
            <Link
              to={Routes.LEADERBOARDS}
              className={`${classes.link} ${classes.navLink} ${
                location.pathname === Routes.LEADERBOARDS ? classes.selectedLink : ""
              }`}
            >
              Leaderboards
            </Link>
            <Link
              to={Routes.SETTINGS}
              className={`${classes.link} ${classes.navLink} ${
                location.pathname === Routes.SETTINGS ? classes.selectedLink : ""
              }`}
            >
              Settings
            </Link>
            <Link
              to={Routes.REPLAYS}
              className={`${classes.link} ${classes.navLink} ${
                location.pathname === Routes.REPLAYS ? classes.selectedLink : ""
              }`}
            >
              Replays
            </Link>
            <Link
              to={Routes.ABOUT}
              className={`${classes.link} ${classes.navLink} ${
                location.pathname === Routes.ABOUT ? classes.selectedLink : ""
              }`}
            >
              About
            </Link>
            {process.env.NODE_ENV === "development" && (
              <Link
                to={Routes.DEBUG}
                className={`${classes.link} ${classes.navLink} ${
                  location.pathname === Routes.DEBUG ? classes.selectedLink : ""
                }`}
              >
                Debug
              </Link>
            )}
          </Group>
          <Group gap={0} className={classes.windowControlsGroup}>
            <Group gap={"xs"}>
              <GameState compact />
              <OnlinePlayers compact />
            </Group>
            <button
              onClick={handleMinimize}
              className={`${classes.link} ${classes.windowButton}`}
              type="button"
              aria-label="Minimize window"
            >
              ─
            </button>
            <button
              onClick={handleToggleMaximize}
              className={`${classes.link} ${classes.windowButton}`}
              type="button"
              aria-label="Maximize window"
            >
              ☐
            </button>
            <button
              onClick={handleClose}
              className={`${classes.link} ${classes.closeButton} ${classes.windowButton}`}
              type="button"
              aria-label="Close window"
            >
              X
            </button>
          </Group>
        </Group>
      </div>
      <Box className={classes.children}>{children}</Box>
    </div>
  );
};
