import React from "react";
import ReactDOM from "react-dom/client";
import { GameOverlayApp } from "./GameOverlayApp";

/**
 * Bootstrap for the overlay webview window.
 *
 * Deliberately minimal: no Sentry, no mixpanel, no Providers, no Router, no Mantine
 * provider (the overlay styles itself with a CSS module). The window must stay
 * transparent, so no stylesheet may paint the body.
 */
export const mountGameOverlay = (root: HTMLElement) => {
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  // Belt and braces - the real click-through is WS_EX_TRANSPARENT on the HWND.
  document.body.style.pointerEvents = "none";
  document.body.style.userSelect = "none";

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <GameOverlayApp />
    </React.StrictMode>,
  );
};
