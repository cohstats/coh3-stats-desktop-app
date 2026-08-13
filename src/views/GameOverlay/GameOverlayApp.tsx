import React, { useEffect, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { CompactMatchup } from "./CompactMatchup";
import { GAME_OVERLAY_DATA_EVENT, GAME_OVERLAY_READY_EVENT, GameOverlayPayload } from "./types";

/**
 * Root of the in-game overlay window.
 *
 * It is purely a renderer: no polling, no API calls, no config store. The main window
 * pushes a payload over `game-overlay:data` and this draws it.
 */
export const GameOverlayApp: React.FC = () => {
  const [payload, setPayload] = useState<GameOverlayPayload>();

  useEffect(() => {
    const unlisten = listen<GameOverlayPayload>(GAME_OVERLAY_DATA_EVENT, (event) => {
      setPayload(event.payload);
    });

    // The sender may have emitted before this window finished loading. Announce
    // ourselves so it can re-push, instead of relying on a global on `window`.
    emit(GAME_OVERLAY_READY_EVENT).catch(console.error);

    return () => {
      unlisten.then((fn) => fn()).catch(console.error);
    };
  }, []);

  // Nothing to draw until data arrives - the window is transparent, so this is blank.
  if (!payload) {
    return null;
  }

  return <CompactMatchup left={payload.left} right={payload.right} map={payload.map} />;
};
