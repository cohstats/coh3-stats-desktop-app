import React, { useContext, useEffect, useCallback, useState } from "react"
import { invoke } from "@tauri-apps/api/tauri"
import { watch } from "tauri-plugin-fs-watch-api"
import { RawGameData } from "./GameData"

/** This hook handles the collection of raw game data from the log file */
export const useRawGameData = () => {
    const [logFilePath, setLogFilePath] = useState<string>()
    const [logFileChecked, setLogFileChecked] = useState(false)
    const [logFileExists, setLogFileExists] = useState<boolean>()
    const [stopWatcher, setStopWatcher] = useState<() => Promise<void>>()
    const [interval, setInterval] = useState(2000)
    const [rawGameData, setRawGameData] = useState<RawGameData>()
    // set the default log file path
    useEffect(() => {
        const getDefaultLogFilePath = async () => {
            const path = (await invoke("get_default_log_file_path")) as string
            setLogFilePath(path)
            setLogFileChecked(false)
        }
        if (logFilePath === undefined) {
            getDefaultLogFilePath()
        }
        console.log("change log file path", logFilePath)
    }, [logFilePath])
    // when log file path is set and unchecked: check for the file
    useEffect(() => {
        const checkLogFile = async () => {
            const result = (await invoke("check_log_file_exists", {
                path: logFilePath,
            })) as boolean
            setLogFileExists(result)
        }
        if (logFilePath !== undefined && logFileChecked === false) {
            checkLogFile()
        }
    }, [logFilePath, logFileChecked])
    // when log file exists start watching
    useEffect(() => {
        const getLogFileData = async (path: string) => {
            const data = (await invoke("parse_log_file_reverse", {
                path,
            })) as RawGameData
            setRawGameData(data)
        }
        const recreateWatcher = async (path: string) => {
            if (stopWatcher) {
                await stopWatcher()
                setStopWatcher(undefined)
            }
            getLogFileData(path)
            const newStopWatcher = await watch(
                path,
                { delayMs: interval },
                () => {
                    getLogFileData(path)
                }
            )
            setStopWatcher(newStopWatcher)
        }
        if (logFilePath !== undefined && logFileChecked && logFileExists) {
            recreateWatcher(logFilePath)
        }
    }, [logFilePath, logFileChecked, logFileExists, interval])
    // used to change the interval the log file is checked
    const setValidatedInterval = useCallback((interval: number) => {
        if (interval > 0) {
            setInterval(interval)
        }
    }, [])
    // used to change the path to the log file
    const setFilePath = useCallback((path: string) => {
        setLogFilePath(path)
        setLogFileChecked(false)
        setLogFileExists(undefined)
    }, [])
    return {
        setInterval: setValidatedInterval,
        setLogFilePath: setFilePath,
        logFilePath,
        logFileChecked,
        logFileFound: logFileExists,
        interval,
        rawGameData,
    }
}
