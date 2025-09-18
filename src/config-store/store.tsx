import { appDataDir } from "@tauri-apps/api/path";
import { Store } from "@tauri-apps/plugin-store";

let CONFIG_StORE: Store | undefined;

export const getStore = async () => {
  if (CONFIG_StORE === undefined) {
    const appDataPath = await appDataDir();
    CONFIG_StORE = await Store.load(appDataPath + "config.dat");
  }
  return CONFIG_StORE;
};
