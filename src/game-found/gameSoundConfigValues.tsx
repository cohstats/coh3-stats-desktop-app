import { configValueFactory } from "../config-store/configValueFactory";

const [getPlaySound, usePlaySound] = configValueFactory<boolean>("playSound", async () => true);

const [getPlaySoundVolume, usePlaySoundVolume] = configValueFactory<number>(
  "playSoundVolume",
  async () => 0.8,
);

export { getPlaySound, usePlaySound, getPlaySoundVolume, usePlaySoundVolume };
