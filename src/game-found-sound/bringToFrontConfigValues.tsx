import { configValueFactory } from "../config-store/configValueFactory";

const [getBringToFrontOnGameFound, useBringToFrontOnGameFound] = configValueFactory<boolean>(
  "bringToFrontOnGameFound",
  async () => false,
);

export { getBringToFrontOnGameFound, useBringToFrontOnGameFound };
