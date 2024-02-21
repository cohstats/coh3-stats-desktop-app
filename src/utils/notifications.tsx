import { notifications } from "@mantine/notifications"
import { IconCheck } from "@tabler/icons-react"
import React from "react"

const showNotification = (
  {
    title,
    message,
    type = "success",
    autoCloseInMs = 10000,
  }: {
    title: string
    message: string | React.ReactNode
    type?: "success" | "error" | "info"
    autoCloseInMs?: number // Default is 10 seconds
  }) => {

  if (type === "success") {
    notifications.show({
      title: title,
      message: message,
      color: "green",
      // 10 seconds
      autoClose: autoCloseInMs,
      icon: <IconCheck />,
    })
  } else if (type === "info") {
    notifications.show({
      title: title,
      message: message,
      color: "blue",
      autoClose: autoCloseInMs,
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
