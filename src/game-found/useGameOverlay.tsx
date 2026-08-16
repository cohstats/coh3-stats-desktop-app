import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emitTo, listen } from "@tauri-apps/api/event";
import { FullGameData, FullTeamData } from "../game-data-provider/GameData-types";
import { detectArrangedTeam } from "../utils/arranged-team-detection";
import {
  GAME_OVERLAY_DATA_EVENT,
  GAME_OVERLAY_READY_EVENT,
  GAME_OVERLAY_WINDOW_LABEL,
  GameOverlayPayload,
  OverlayTeam,
  OverlayTeamKind,
} from "../views/GameOverlay/types";
import { useGameOverlayEnabled } from "./gameOverlayConfigValues";
import config from "../config";

/**
 * A stalled log parse must never leave the overlay on screen forever. Generous, so a
 * slow disk loading a 4v4 map does not lose the overlay early.
 */
const SAFETY_TIMEOUT_MS = 180_000;

const buildTeam = async (team: FullTeamData): Promise<OverlayTeam> => {
  let teamKind: OverlayTeamKind = "random";
  let groups: OverlayTeam["groups"] = [];
  let teamElo: number | undefined;

  try {
    const detected = await detectArrangedTeam(team.players, team.side);
    if (detected.team) {
      teamKind = "arranged";
      teamElo = detected.team.elo;
    } else if (detected.groups.length > 0) {
      teamKind = "friends";
      groups = detected.groups;
    }
  } catch (e) {
    // Detection is a nice-to-have; the matchup itself still gets shown.
    console.warn("[GameOverlay] Arranged team detection failed:", e);
  }

  return { side: team.side, players: team.players, teamKind, groups, teamElo };
};

/**
 * Shows the in-game matchup overlay over CoH3 while the game is on its loading screen.
 *
 * Mounted once, next to useAudioManager in GameDataProvider. The window itself already
 * exists (created hidden at startup by the Rust side); this only pushes data and calls
 * show/hide.
 */
export const useGameOverlay = (gameData: FullGameData | undefined) => {
  const [gameOverlayEnabled] = useGameOverlayEnabled();
  /** uniqueID of the match the overlay is currently up for, or null when hidden. */
  const shownForRef = useRef<string | null>(null);
  /** Last payload, so we can re-push it if the overlay window mounts after we emitted. */
  const payloadRef = useRef<GameOverlayPayload | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hide = () => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (shownForRef.current === null) {
      return;
    }
    shownForRef.current = null;
    payloadRef.current = undefined;
    invoke("game_overlay_hide").catch((e) =>
      console.error("[GameOverlay] Failed to hide overlay:", e),
    );
  };

  // The overlay window announces itself on mount - re-push in case we emitted first.
  useEffect(() => {
    const unlisten = listen(GAME_OVERLAY_READY_EVENT, () => {
      if (payloadRef.current) {
        emitTo(GAME_OVERLAY_WINDOW_LABEL, GAME_OVERLAY_DATA_EVENT, payloadRef.current).catch(
          console.error,
        );
      }
    });
    return () => {
      unlisten.then((fn) => fn()).catch(console.error);
    };
  }, []);

  useEffect(() => {
    // no_win_condition and AI matches are single-player / vs-bots - no matchup to show.
    const shouldShow =
      config.MS_STORE_EDITION &&
      gameOverlayEnabled === true &&
      gameData !== undefined &&
      gameData.state === "Loading" &&
      gameData.winCondition !== "no_win_condition" &&
      gameData.type !== "AI";

    if (!shouldShow) {
      hide();
      return;
    }

    // Already up for this match - don't rebuild or re-show.
    if (shownForRef.current === gameData.uniqueID) {
      return;
    }
    shownForRef.current = gameData.uniqueID;

    (async () => {
      const [left, right] = await Promise.all([
        buildTeam(gameData.left),
        buildTeam(gameData.right),
      ]);

      // Bail out if the loading screen ended while we were fetching.
      if (shownForRef.current !== gameData.uniqueID) {
        return;
      }

      const payload: GameOverlayPayload = {
        uniqueID: gameData.uniqueID,
        map: gameData.map,
        left,
        right,
      };
      payloadRef.current = payload;

      try {
        // Emit before show so the first paint already has data.
        await emitTo(GAME_OVERLAY_WINDOW_LABEL, GAME_OVERLAY_DATA_EVENT, payload);
        await invoke("game_overlay_show");
      } catch (e) {
        console.error("[GameOverlay] Failed to show overlay:", e);
        return;
      }

      // A back-to-back match reuses this effect without going through `hide`, so the
      // previous match's timer would otherwise still be armed and pull this overlay.
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        console.warn("[GameOverlay] Safety timeout reached, hiding overlay");
        hide();
      }, SAFETY_TIMEOUT_MS);
    })();
  }, [gameData?.uniqueID, gameData?.state, gameData?.type, gameOverlayEnabled]);

  // Never leave the overlay on screen when this unmounts.
  useEffect(() => hide, []);
};
