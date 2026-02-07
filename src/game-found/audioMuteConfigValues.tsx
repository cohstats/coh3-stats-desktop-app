import { configValueFactory } from "../config-store/configValueFactory";

const [getAutoMuteEnabled, useAutoMuteEnabled] = configValueFactory<boolean>(
  "autoMuteEnabled",
  async () => true, // Default: enabled
);

const [getMuteOnlyOutOfGame, useMuteOnlyOutOfGame] = configValueFactory<boolean>(
  "muteOnlyOutOfGame",
  async () => false, // Default: mute always when not in foreground
);

export { getAutoMuteEnabled, useAutoMuteEnabled, getMuteOnlyOutOfGame, useMuteOnlyOutOfGame };
