import { configValueFactory } from "../config-store/configValueFactory";

const [getGameOverlayEnabled, useGameOverlayEnabled] = configValueFactory<boolean>(
  "gameOverlayEnabled",
  async () => true,
);

export { getGameOverlayEnabled, useGameOverlayEnabled };
