import React, { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/tauri"
import { RawGameData } from "./GameData"
import { useInterval } from "@mantine/hooks"

/** This hook handles the collection of raw game data from the log file */
export const useRawGameData = () => {
    const [logFilePath, setExistingLogFilePath] = useState<string>()
    const [rawGameData, setRawGameData] = useState<RawGameData>()
    const getLogFileData = async (path: string) => {
        const data = (await invoke("parse_log_file_reverse", {
            path,
        })) as RawGameData
        setRawGameData(data)
    }
    const interval = useInterval(() => {
        console.log("Check log file")
        if (logFilePath !== undefined) {
            getLogFileData(logFilePath)
        }
    }, 2000)

    const setLogFilePath = async (logFilePath: string) => {
        const result = (await invoke("check_log_file_exists", {
            path: logFilePath,
        })) as boolean
        if (result) {
            setExistingLogFilePath(logFilePath)
            return
        }
        setExistingLogFilePath(undefined)
    }
    // set the default log file path
    useEffect(() => {
        const getDefaultLogFilePath = async () => {
            const path = (await invoke("get_default_log_file_path")) as string
            setLogFilePath(path)
        }
        if (logFilePath === undefined) {
            getDefaultLogFilePath()
        }
    }, [logFilePath])

    const reloadLogFile = () => {
        if (logFilePath !== undefined) {
            getLogFileData(logFilePath)
        }
    }
    // when log file exists start watching the log file
    useEffect(() => {
        if (logFilePath !== undefined) {
            interval.start()
        }
    }, [logFilePath, interval])
    return {
        setLogFilePath: setLogFilePath,
        logFilePath,
        rawGameData,
        logFileFound: logFilePath !== undefined,
        reloadLogFile,
    }
}
