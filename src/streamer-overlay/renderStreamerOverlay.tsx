import { FullGameData } from "../game-data-provider/GameData"
import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs"
import { renderToStaticMarkup, renderToString } from "react-dom/server"
import { OverlayApp } from "./SPECIAL-REACT/OverlayApp"
import { HTML } from "./SPECIAL-REACT/HTML"
import { getShowFlagsOverlay, getAlwaysShowOverlay } from "./configValues"

export const renderStreamerHTML = async (gameData: FullGameData) => {
  const content = renderToString(
    <OverlayApp
      gameData={gameData}
      flags={await getShowFlagsOverlay()}
      alwaysVisible={await getAlwaysShowOverlay()}
    />
  )
  const html = renderToStaticMarkup(<HTML html={content} />)
  await writeTextFile("streamerOverlay.html", `<!doctype html>\n${html}`, {
    dir: BaseDirectory.AppData,
  })
}
