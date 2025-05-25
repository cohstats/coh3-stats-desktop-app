import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import React from "react";

interface ErrorCardProps {
  title: string;
  body: string;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ title, body }) => {
  return (
    <Alert icon={<IconAlertCircle size={16} />} title={title} color="red">
      {body}
    </Alert>
  );
};

export default ErrorCard;
