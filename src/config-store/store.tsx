import { appDataDir } from "@tauri-apps/api/path"
import { Store } from "tauri-plugin-store-api"

let CONFIG_StORE: Store | undefined

export const getStore = async () => {
  if (CONFIG_StORE === undefined) {
    const appDataPath = await appDataDir()
    CONFIG_StORE = new Store(appDataPath + "config.dat")
    try {
      await CONFIG_StORE.load()
    } catch {
      await CONFIG_StORE.save()
    }
  }
  return CONFIG_StORE
}
