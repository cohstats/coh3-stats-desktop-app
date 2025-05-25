import { Box, Group } from "@mantine/core";
import { appWindow } from "@tauri-apps/api/window";
import { Link, useLocation } from "react-router";
import logo from "./assets/logo/32x32.png";
import { Routes } from "./Router";
import classes from "./WindowTitleBar.module.css";
import React from "react";
import { saveWindowState, StateFlags } from "tauri-plugin-window-state-api";

export interface WindowTitleBarProps {
  children?: React.ReactNode;
}

export const WindowTitleBar: React.FC<WindowTitleBarProps> = ({ children }) => {
  const location = useLocation();
  return (
    <div className={classes.wrapper}>
      <div className={classes.header} data-tauri-drag-region>
        <Group data-tauri-drag-region justify="space-between" pl="xs">
          <Group data-tauri-drag-region gap={4}>
            <img data-tauri-drag-region src={logo} width={20} />
            <Link
              to={Routes.GAME}
              className={`${classes.link} ${
                location.pathname === Routes.GAME ? classes.selectedLink : ""
              }`}
            >
              Game
            </Link>
            <Link
              to={Routes.RECENT_GAMES}
              className={`${classes.link} ${
                location.pathname === Routes.RECENT_GAMES ? classes.selectedLink : ""
              }`}
            >
              Recent Games
            </Link>
            <Link
              to={Routes.SETTINGS}
              className={`${classes.link} ${
                location.pathname === Routes.SETTINGS ? classes.selectedLink : ""
              }`}
            >
              Settings
            </Link>
            <Link
              to={Routes.REPLAYS}
              className={`${classes.link} ${
                location.pathname === Routes.REPLAYS ? classes.selectedLink : ""
              }`}
            >
              Replays
            </Link>
            <Link
              to={Routes.ABOUT}
              className={`${classes.link} ${
                location.pathname === Routes.ABOUT ? classes.selectedLink : ""
              }`}
            >
              About
            </Link>
            {process.env.NODE_ENV === "development" && (
              <Link
                to={Routes.DEBUG}
                className={`${classes.link} ${
                  location.pathname === Routes.DEBUG ? classes.selectedLink : ""
                }`}
              >
                Debug
              </Link>
            )}
          </Group>
          <Group data-tauri-drag-region gap={0}>
            <a
              onClick={() => appWindow.minimize()}
              className={`${classes.link} ${classes.windowButton}`}
            >
              ─
            </a>
            <a
              onClick={() => appWindow.toggleMaximize()}
              className={`${classes.link} ${classes.windowButton}`}
            >
              ☐
            </a>
            <a
              onClick={async () => {
                await saveWindowState(StateFlags.ALL);
                await appWindow.close();
              }}
              className={`${classes.link} ${classes.closeButton} ${classes.windowButton}`}
            >
              X
            </a>
          </Group>
        </Group>
      </div>
      <Box className={classes.children}>{children}</Box>
    </div>
  );
};
