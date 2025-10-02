import { getPlaySoundVolume } from "./gameSoundConfigValues";

export const playSound = async () => {
  const audio = new Audio("/hoorah.wav");
  audio.volume = await getPlaySoundVolume();
  audio.play();
};
