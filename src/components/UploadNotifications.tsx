import {useEffect} from "react";
import {listen} from "@tauri-apps/api/event";
import {showNotification} from "../utils/notifications";


export const UploadNotifications = () => {


  useEffect(() => {

    const unListenUploadSuccess = listen<null>("cohdb:upload:success", (event) => {

      if (event.payload != null) {
        showNotification({
          title: "Successfully uploaded latest replay to cohdb!",
          message: "Your last game has been uploaded to cohdb",
          type: "success",
        })
      }
    })

    const unListenUploadFailure = listen<null>("cohdb:upload:failure", (event) => {

      if (event.payload != null) {
        showNotification({
          title: "Error uploading replay to cohdb!",
          message: "There was an error uploading your last game to cohdb, check the logs for more information",
          type: "error",
        })
      }
    })


    return () => {
      unListenUploadSuccess.then((f) => f())
      unListenUploadFailure.then((f) => f())
    }
  }, [])


  return (<> </>)
}
