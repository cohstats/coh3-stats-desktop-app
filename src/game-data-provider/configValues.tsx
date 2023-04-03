import { configValueFactory } from "../config-store/configValueFactory"
import { invoke } from "@tauri-apps/api/tauri"

const [getLogFilePath, useLogFilePath] = configValueFactory<string | undefined>(
  "logFilePath",
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

    return undefined
  }
)

export { getLogFilePath, useLogFilePath }
