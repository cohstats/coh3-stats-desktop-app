import { Store } from "tauri-plugin-store-api"
import { invoke } from "@tauri-apps/api/tauri"
import { useEffect, useRef, useState } from "react"
import { UnlistenFn } from "@tauri-apps/api/event"
import { appDataDir } from "@tauri-apps/api/path"
import { EventEmitter } from "@tauri-apps/api/shell"

const LOG_FILE_PATH_KEY = "logFilePath"
let CONFIG_STORE: Store | undefined
const LOG_FILE_CHANGE_EVENT = new EventEmitter()

export const getStore: () => Promise<Store> = async () => {
    if (CONFIG_STORE === undefined) {
        const appDataPath = await appDataDir()
        CONFIG_STORE = new Store(appDataPath + "config.dat")
        try {
            await CONFIG_STORE.load()
        } catch {
            // cannot load => file doesnt exist => create file with save
            await CONFIG_STORE.save()
        }
        const hasLogFilePath = await CONFIG_STORE.has(LOG_FILE_PATH_KEY)
        if (!hasLogFilePath) {
            trySetDefaultLogFilePath(CONFIG_STORE)
        }
        if (hasLogFilePath) {
            const logFilePath = (await CONFIG_STORE.get<string>(
                LOG_FILE_PATH_KEY
            ))!
            const logFileExists = (await invoke("check_log_file_exists", {
                path: logFilePath,
            })) as boolean
            if (!logFileExists) {
                trySetDefaultLogFilePath(CONFIG_STORE)
            }
        }
    }
    return CONFIG_STORE
}

const trySetDefaultLogFilePath = async (store: Store) => {
    const defaultLogFilePath = (await invoke(
        "get_default_log_file_path"
    )) as string
    const defaultLogFileExists = (await invoke("check_log_file_exists", {
        path: defaultLogFilePath,
    })) as boolean
    if (defaultLogFileExists) {
        await store.set(LOG_FILE_PATH_KEY, defaultLogFilePath)
        await store.save()
        LOG_FILE_CHANGE_EVENT.emit("change", defaultLogFilePath)
    }
}

export const trySetLogFilePath: (path: string) => Promise<boolean> = async (
    path: string
) => {
    const store = await getStore()
    const logFileExists = (await invoke("check_log_file_exists", {
        path: path,
    })) as boolean
    if (logFileExists) {
        await store.set(LOG_FILE_PATH_KEY, path)
        await store.save()
        LOG_FILE_CHANGE_EVENT.emit("change", path)
        return true
    }
    return false
}

/*export const getLogFilePath = async () => {
    const store = await getStore()
    const hasLogFilePath = await store.has("logFilePath")
    if (hasLogFilePath) {
        return await store.get("logFilePath")
    }
    return undefined
}*/

export const useLogFilePath = () => {
    const [logFilePath, setLogFilePath] = useState<string>()
    const valueInitializedRef = useRef(false)

    useEffect(() => {
        const onChange = (path: string) => {
            setLogFilePath(path)
        }
        const initializeValue = async () => {
            const store = await getStore()
            const initialValue = await store.get<string>(LOG_FILE_PATH_KEY)
            if (initialValue === null) {
                setLogFilePath(undefined)
            } else {
                setLogFilePath(initialValue)
            }
            valueInitializedRef.current = true
        }
        if (valueInitializedRef.current === false) {
            initializeValue()
        }
        LOG_FILE_CHANGE_EVENT.on("change", onChange)
        return () => {
            LOG_FILE_CHANGE_EVENT.off("change", onChange)
        }
    }, [])

    return logFilePath
}