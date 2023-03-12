import { Store } from "tauri-plugin-store-api"
import { invoke } from "@tauri-apps/api/tauri"
import { useEffect, useRef, useState } from "react"
import { appDataDir } from "@tauri-apps/api/path"
import { EventEmitter } from "@tauri-apps/api/shell"
import events from "./analytics/mixpanel"

const LOG_FILE_PATH_KEY = "logFilePath"
const PLAY_SOUND_KEY = "playSound"
const PLAY_SOUND_VOLUME_KEY = "playSoundVolume"

let CONFIG_STORE: Store | undefined
const CONFIG_CHANGE_EVENT = new EventEmitter()

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
        const hasPlaySound = await CONFIG_STORE.has(PLAY_SOUND_KEY)
        if (!hasPlaySound) {
            await CONFIG_STORE.set(PLAY_SOUND_KEY, false)
            await CONFIG_STORE.save()
        }
        const hasPlaySoundVolume = await CONFIG_STORE.has(PLAY_SOUND_VOLUME_KEY)
        if (!hasPlaySoundVolume) {
            await CONFIG_STORE.set(PLAY_SOUND_VOLUME_KEY, 0.8)
            await CONFIG_STORE.save()
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
        CONFIG_CHANGE_EVENT.emit(LOG_FILE_PATH_KEY, defaultLogFilePath)
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
        CONFIG_CHANGE_EVENT.emit(LOG_FILE_PATH_KEY, path)
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
        CONFIG_CHANGE_EVENT.on(LOG_FILE_PATH_KEY, onChange)
        return () => {
            CONFIG_CHANGE_EVENT.off(LOG_FILE_PATH_KEY, onChange)
        }
    }, [])

    return logFilePath
}

export const usePlaySound = () => {
    const [playSound, setPlaySound] = useState(false)
    const valueInitializedRef = useRef(false)

    useEffect(() => {
        const onChange = (value: boolean) => {
            setPlaySound(value)
        }
        const initializeValue = async () => {
            const store = await getStore()
            const initialValue = await store.get<boolean>(PLAY_SOUND_KEY)
            if (initialValue === null) {
                setPlaySound(false)
            } else {
                setPlaySound(initialValue)
            }
            valueInitializedRef.current = true
        }
        if (valueInitializedRef.current === false) {
            initializeValue()
        }
        CONFIG_CHANGE_EVENT.on(PLAY_SOUND_KEY, onChange)
        return () => {
            CONFIG_CHANGE_EVENT.off(PLAY_SOUND_KEY, onChange)
        }
    }, [])

    const setPlaySoundInStore = async (value: boolean) => {
        const store = await getStore()
        await store.set(PLAY_SOUND_KEY, value)
        await store.save()
        CONFIG_CHANGE_EVENT.emit(PLAY_SOUND_KEY, value)
    }

    return { playSound, setPlaySound: setPlaySoundInStore }
}

export const getPlaySound = async () => {
    const store = await getStore()
    const value = await store.get(PLAY_SOUND_KEY)
    if (value === null) {
        return false
    }
    return value
}

export const usePlaySoundVolume = () => {
    const [playSoundVolume, setPlaySoundVolume] = useState(0.8)
    const valueInitializedRef = useRef(false)

    useEffect(() => {
        const onChange = (value: number) => {
            const roundedValue = Math.round(value * 100) / 100
            events.settings_changed("play_sound_volume", roundedValue)
            setPlaySoundVolume(roundedValue)
        }
        const initializeValue = async () => {
            const store = await getStore()
            const initialValue = await store.get<number>(PLAY_SOUND_VOLUME_KEY)
            if (initialValue === null) {
                setPlaySoundVolume(0.8)
            } else {
                setPlaySoundVolume(initialValue)
            }
            valueInitializedRef.current = true
        }
        if (valueInitializedRef.current === false) {
            initializeValue()
        }
        CONFIG_CHANGE_EVENT.on(PLAY_SOUND_VOLUME_KEY, onChange)
        return () => {
            CONFIG_CHANGE_EVENT.off(PLAY_SOUND_VOLUME_KEY, onChange)
        }
    }, [])

    const setPlaySoundInStore = async (value: number) => {
        const store = await getStore()
        await store.set(PLAY_SOUND_VOLUME_KEY, value)
        await store.save()
        CONFIG_CHANGE_EVENT.emit(PLAY_SOUND_VOLUME_KEY, value)
    }

    return { playSoundVolume, setPlaySoundVolume: setPlaySoundInStore }
}

export const getPlaySoundVolume = async () => {
    const store = await getStore()
    const value = await store.get<number>(PLAY_SOUND_VOLUME_KEY)
    if (value === null) {
        return 0.8
    }
    return value
}
