import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RawGameData } from "./GameData-types";
import { useLogFilePath } from "./configValues";
import config from "../config";

/** This hook handles the collection of raw game data from the log file */
export const useRawGameData = () => {
  const [logFilePath] = useLogFilePath();
  const [rawGameData, setRawGameData] = useState<RawGameData>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const inFlightRef = useRef(false);

  const getLogFileData = async (path: string) => {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    try {
      const data = (await invoke("parse_log_file_reverse", {
        path,
      })) as RawGameData;
      setRawGameData(data);
    } finally {
      inFlightRef.current = false;
    }
  };

  const reloadLogFile = () => {
    if (logFilePath !== undefined) {
      getLogFileData(logFilePath);
    }
  };
  // when log file exists start watching the log file
  useEffect(() => {
    if (logFilePath !== undefined) {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        if (logFilePath !== undefined) {
          getLogFileData(logFilePath);
        }
      }, config.TIME_LOG_FILE_READER_MS);
    }

    return () => {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [logFilePath]);
  return {
    rawGameData,
    reloadLogFile,
  };
};
