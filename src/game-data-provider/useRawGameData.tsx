import React, {
    useContext,
    useEffect,
    useCallback,
    useState,
    useRef,
} from "react"
import { invoke } from "@tauri-apps/api/tauri"
import { watch } from "tauri-plugin-fs-watch-api"
import { RawGameData } from "./GameData"
import { UnlistenFn } from "@tauri-apps/api/event"

/** This hook handles the collection of raw game data from the log file */
export const useRawGameData = () => {
    const [logFilePath, setExistingLogFilePath] = useState<string>()
    const stopWatcherRef = useRef<UnlistenFn>()
    const [interval, setInterval] = useState(200) // default log file checking interval is 2 seconds
    const [rawGameData, setRawGameData] = useState<RawGameData>()

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
    const getLogFileData = async (path: string) => {
        const data = (await invoke("parse_log_file_reverse", {
            path,
        })) as RawGameData
        setRawGameData(data)
    }
    const reloadLogFile = () => {
        if (logFilePath) {
            getLogFileData(logFilePath)
        }
    }
    // when log file exists start watching the log file
    useEffect(() => {
        const recreateWatcher = async (path: string) => {
            if (stopWatcherRef.current) {
                await stopWatcherRef.current()
                stopWatcherRef.current = undefined
            }
            getLogFileData(path)
            const newStopWatcher = await watch(
                path,
                {
                    //delayMs: interval
                },
                () => {
                    console.log("log file updated")
                    getLogFileData(path)
                }
            )
            stopWatcherRef.current = newStopWatcher
        }
        if (logFilePath !== undefined) {
            recreateWatcher(logFilePath)
        }
    }, [logFilePath, interval])
    // used to change the interval the log file is checked
    const setValidatedInterval = useCallback((interval: number) => {
        if (interval > 0) {
            setInterval(interval)
        }
    }, [])
    return {
        setInterval: setValidatedInterval,
        setLogFilePath: setLogFilePath,
        logFilePath,
        interval,
        rawGameData,
        logFileFound: logFilePath !== undefined,
        reloadLogFile,
    }
}
