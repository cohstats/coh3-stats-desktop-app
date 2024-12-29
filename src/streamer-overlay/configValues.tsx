import { configValueFactory } from "../config-store/configValueFactory";

const [getShowFlagsOverlay, useShowFlagsOverlay] = configValueFactory<boolean>(
  "showFlagsOverlay",
  async () => false,
);

const [getAlwaysShowOverlay, useAlwaysShowOverlay] = configValueFactory<boolean>(
  "alwaysShowOverlay",
  async () => false,
);

const [getStreamerOverlayEnabled, useStreamerOverlayEnabled] = configValueFactory<boolean>(
  "streamerOverlayEnabled",
  async () => false,
);

export {
  getShowFlagsOverlay,
  useShowFlagsOverlay,
  getAlwaysShowOverlay,
  useAlwaysShowOverlay,
  getStreamerOverlayEnabled,
  useStreamerOverlayEnabled,
};
