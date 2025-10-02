import { configValueFactory } from "../config-store/configValueFactory";

const [getFontScale, useFontScale] = configValueFactory<number>(
  "fontScale",
  async () => 1.0, // Default scale is 1.0 (100%)
);

export { getFontScale, useFontScale };
