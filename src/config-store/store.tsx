import { load } from "@tauri-apps/plugin-store";

let CONFIG_StORE: Awaited<ReturnType<typeof load>> | undefined;

export const getStore = async () => {
  if (CONFIG_StORE === undefined) {
    // In Tauri v2, use relative path and the store will be created in the app data directory
    CONFIG_StORE = await load("config.dat", {
      defaults: {},
      autoSave: true,
    });
  }
  return CONFIG_StORE;
};
