import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAutoMuteEnabled, useMuteOnlyOutOfGame } from "./audioMuteConfigValues";
import { FullGameData } from "../game-data-provider/GameData-types";

/**
 * Hook to manage audio muting lifecycle.
 * Automatically mutes/unmutes the game based on window focus and settings.
 *
 * Audio muting is enabled/disabled based on the autoMuteEnabled setting.
 * The muteOnlyOutOfGame setting and game state are passed to the backend
 * to control whether muting actually happens.
 *
 * @param gameData - The current game data, or undefined if no game is active
 */
export const useAudioManager = (gameData: FullGameData | undefined) => {
  const [autoMuteEnabled] = useAutoMuteEnabled();
  const [muteOnlyOutOfGame] = useMuteOnlyOutOfGame();
  const isMutingEnabledRef = useRef(false);

  // Effect to enable/disable audio muting based on autoMuteEnabled
  useEffect(() => {
    if (autoMuteEnabled) {
      if (!isMutingEnabledRef.current) {
        console.log("[AudioManager] Enabling audio muting...");
        invoke("enable_audio_muting")
          .then(() => {
            console.log("[AudioManager] Audio muting enabled");
            isMutingEnabledRef.current = true;
          })
          .catch((error) => {
            console.error("[AudioManager] Failed to enable audio muting:", error);
          });
      }
    } else {
      if (isMutingEnabledRef.current) {
        console.log("[AudioManager] Disabling audio muting");
        invoke("disable_audio_muting").catch(console.error);
        isMutingEnabledRef.current = false;
      }
    }

    // Cleanup on unmount
    return () => {
      if (isMutingEnabledRef.current) {
        console.log("[AudioManager] Cleanup: disabling audio muting");
        invoke("disable_audio_muting").catch(console.error);
        isMutingEnabledRef.current = false;
      }
    };
  }, [autoMuteEnabled]);

  // Effect to update mute settings when muteOnlyOutOfGame or game state changes
  useEffect(() => {
    // Only update settings if monitoring is active
    if (!autoMuteEnabled) {
      return;
    }

    // Don't invoke until muteOnlyOutOfGame is loaded
    if (muteOnlyOutOfGame === undefined) {
      return;
    }

    const gameState = gameData?.state;
    const isInGame = gameState === "InGame" || gameState === "Loading";

    console.log("[AudioManager] Updating mute settings:", {
      muteOnlyOutOfGame,
      gameState,
      isInGame,
    });

    invoke("update_audio_mute_settings", {
      mute_only_out_of_game: muteOnlyOutOfGame,
      is_in_game: isInGame,
    }).catch((error) => {
      console.error("[AudioManager] Failed to update mute settings:", error);
    });
  }, [autoMuteEnabled, muteOnlyOutOfGame, gameData?.state]);
};
