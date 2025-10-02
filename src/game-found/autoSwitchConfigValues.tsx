import { configValueFactory } from "../config-store/configValueFactory";

const [getAutoSwitchToGame, useAutoSwitchToGame] = configValueFactory<boolean>(
  "autoSwitchToGameView",
  async () => true,
);

export { getAutoSwitchToGame, useAutoSwitchToGame };
