import { notifications } from "@mantine/notifications"
import { IconCheck } from "@tabler/icons-react"
import React from "react"

const showNotification = ({
  title,
  message,
  type,
}: {
  title: string
  message: string
  type: "success" | "error"
}) => {
  if (type === "success") {
    notifications.show({
      title: title,
      message: message,
      color: "green",
      // 10 seconds
      autoClose: 10000,
      icon: <IconCheck />,
    })
  } else {
    notifications.show({
      title: title,
      message: message,
      color: "red",
      // 3 minutes
      autoClose: 180000,
    })
  }
}

export { showNotification }
