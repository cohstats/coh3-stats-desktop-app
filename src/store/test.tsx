import { useConfigValue } from "./hooks"
import { invoke } from "@tauri-apps/api/tauri"

export const useLogFilePath = useConfigValue<string | null>(
    "LOGFILEPATH",
    async () => (await invoke("get_default_log_file_path")) as string,
    async (value, store, defaultValue) => {
        const logFileExists = (await invoke("check_log_file_exists", {
            path: value,
        })) as boolean
        if (logFileExists) {
            return value
        }
        const defaultLogFileExists = (await invoke("check_log_file_exists", {
            path: defaultValue,
        })) as boolean
        if (defaultLogFileExists) {
            return defaultValue
        }

        return null
    }
)

export const usePlaySound = useConfigValue<boolean>(
    "PLAYSOUND",
    async () => false
)

export const usePlaySoundVolume = useConfigValue<number>(
    "PLAYSOUNDVOLUME",
    async () => 0.8
)
