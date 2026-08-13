import { configValueFactory } from "../config-store/configValueFactory";

const [getGameOverlayEnabled, useGameOverlayEnabled] = configValueFactory<boolean>(
  "gameOverlayEnabled",
  async () => false,
);

export { getGameOverlayEnabled, useGameOverlayEnabled };
