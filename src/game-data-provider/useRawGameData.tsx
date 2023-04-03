import React, { useEffect, useRef, useState } from "react"
import { invoke } from "@tauri-apps/api/tauri"
import { RawGameData } from "./GameData"
import { useLogFilePath } from "./configValues"

/** This hook handles the collection of raw game data from the log file */
export const useRawGameData = () => {
  const [logFilePath] = useLogFilePath()
  const [rawGameData, setRawGameData] = useState<RawGameData>()
  const intervalRef = useRef<number>()
  const getLogFileData = async (path: string) => {
    const data = (await invoke("parse_log_file_reverse", {
      path,
    })) as RawGameData
    setRawGameData(data)
  }

  const reloadLogFile = () => {
    if (logFilePath !== undefined) {
      getLogFileData(logFilePath)
    }
  }
  // when log file exists start watching the log file
  useEffect(() => {
    if (logFilePath !== undefined) {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current)
      }
      intervalRef.current = setInterval(() => {
        if (logFilePath !== undefined) {
          getLogFileData(logFilePath)
        }
      }, 2000)
    }
  }, [logFilePath])
  return {
    rawGameData,
    reloadLogFile,
  }
}
