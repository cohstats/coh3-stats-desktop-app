import { FullGameData } from "../game-data-provider/GameData-types";
import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { OverlayApp } from "./SPECIAL-REACT/OverlayApp";
import { HTML } from "./SPECIAL-REACT/HTML";
import {
  getShowFlagsOverlay,
  getAlwaysShowOverlay,
  getStreamerOverlayEnabled,
} from "./configValues";
import { showNotification } from "../utils/notifications";

export const renderStreamerHTML = async (gameData: FullGameData) => {
  // Don't render if streamer overlay is disabled
  const isEnabled = await getStreamerOverlayEnabled();
  if (!isEnabled) {
    return;
  }

  const content = renderToString(
    <OverlayApp
      gameData={gameData}
      flags={await getShowFlagsOverlay()}
      alwaysVisible={await getAlwaysShowOverlay()}
    />,
  );
  const html = renderToStaticMarkup(<HTML html={content} />);
  try {
    await writeTextFile("streamerOverlay.html", `<!doctype html>\n${html}`, {
      dir: BaseDirectory.AppData,
    });
  } catch (e) {
    showNotification({
      title: "Error saving streamer overlay!",
      message:
        "There was an error generating streamerOverlay.html, if you don't need it you can disable it in the settings. " +
        "Otherwise please report this problem in our Discord.",
      type: "error",
    });
    console.error("Failed to write streamer overlay html", e);
  }
};
