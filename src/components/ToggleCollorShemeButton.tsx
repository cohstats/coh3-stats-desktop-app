import React from "react";
import { ActionIcon, Tooltip, useMantineColorScheme } from "@mantine/core";
import { IconSun, IconMoonStars } from "@tabler/icons-react";

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Tooltip label={colorScheme === "dark" ? "Light mode" : "Dark mode"}>
      <ActionIcon
        onClick={() => setColorScheme(colorScheme === "dark" ? "light" : "dark")}
        variant="light"
        color={colorScheme === "dark" ? "yellow" : "blue"}
      >
        {colorScheme === "dark" ? (
          <IconSun size={20} stroke={1.5} />
        ) : (
          <IconMoonStars size={20} stroke={1.5} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
