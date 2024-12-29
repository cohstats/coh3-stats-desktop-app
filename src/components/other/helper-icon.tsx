import { IconInfoCircle } from "@tabler/icons-react";
import React from "react";
import { ActionIcon, FloatingPosition, Tooltip } from "@mantine/core";

const HelperIcon = ({
  content,
  toolTipWidth = 400,
  iconSize = 20,
  position = "top",
}: {
  content: string | React.ReactNode;
  toolTipWidth?: number;
  iconSize?: number;
  position?: FloatingPosition;
}) => {
  return (
    <ActionIcon p={0} variant="default">
      <Tooltip
        label={<div style={{ textAlign: "left" }}>{content}</div>}
        withArrow
        multiline
        w={toolTipWidth}
        position={position}
      >
        <IconInfoCircle size={iconSize} />
      </Tooltip>
    </ActionIcon>
  );
};

export default HelperIcon;
