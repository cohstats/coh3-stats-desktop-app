import { useEffect } from "react";
import { useFontScale } from "../config-store/fontScaleConfig";

/**
 * This component injects CSS custom properties for font scaling
 * into the document root, allowing CSS modules to use them dynamically.
 */
export const FontScaleInjector: React.FC = () => {
  const [fontScale] = useFontScale();

  useEffect(() => {
    if (fontScale !== undefined) {
      const scale = fontScale;

      // Set CSS custom properties on the root element
      document.documentElement.style.setProperty(
        "--mantine-font-size-xs",
        `calc(0.75rem * ${scale})`,
      );
      document.documentElement.style.setProperty(
        "--mantine-font-size-sm",
        `calc(0.875rem * ${scale})`,
      );
      document.documentElement.style.setProperty(
        "--mantine-font-size-md",
        `calc(1rem * ${scale})`,
      );
      document.documentElement.style.setProperty(
        "--mantine-font-size-lg",
        `calc(1.125rem * ${scale})`,
      );
      document.documentElement.style.setProperty(
        "--mantine-font-size-xl",
        `calc(1.25rem * ${scale})`,
      );

      // Set heading sizes
      document.documentElement.style.setProperty(
        "--mantine-h1-font-size",
        `calc(2.125rem * ${scale})`,
      );
      document.documentElement.style.setProperty(
        "--mantine-h2-font-size",
        `calc(1.625rem * ${scale})`,
      );
      document.documentElement.style.setProperty(
        "--mantine-h3-font-size",
        `calc(1.375rem * ${scale})`,
      );
      document.documentElement.style.setProperty(
        "--mantine-h4-font-size",
        `calc(1.125rem * ${scale})`,
      );
      document.documentElement.style.setProperty(
        "--mantine-h5-font-size",
        `calc(1rem * ${scale})`,
      );
      document.documentElement.style.setProperty(
        "--mantine-h6-font-size",
        `calc(0.875rem * ${scale})`,
      );
    }
  }, [fontScale]);

  return null;
};
