import { FullGameData } from "../game-data-provider/GameData"
import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs"
import { renderToStaticMarkup, renderToString } from "react-dom/server"
import { OverlayApp } from "./OverlayApp"
import { HTML } from "./HTML"

export const renderStreamerHTML = async (gameData: FullGameData) => {
    const content = renderToString(<OverlayApp gameData={gameData} />)
    const html = renderToStaticMarkup(<HTML html={content} />)
    console.log("HTML", HTML)
    await writeTextFile("streamerOverlay.html", `<!doctype html>\n${html}`, {
        dir: BaseDirectory.AppData,
    })
}
