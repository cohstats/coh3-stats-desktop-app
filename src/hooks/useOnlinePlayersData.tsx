import { useEffect, useRef, useState } from "react";
import { getNumberOfOnlinePlayersSteamUrl } from "../utils/steam-api";
import { fetch } from "@tauri-apps/plugin-http";

interface OnlinePlayersData {
  playerCount: number;
  timeStampMs: number;
}

export const useOnlinePlayersData = () => {
  const [onlinePlayersData, setOnlinePlayersData] = useState<OnlinePlayersData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchOnlinePlayersData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchResponse = await fetch(getNumberOfOnlinePlayersSteamUrl());
      const { response } = await fetchResponse.json();

      setOnlinePlayersData({
        playerCount: response.player_count,
        timeStampMs: new Date().getTime(),
      });
    } catch (e) {
      console.error("Error fetching online players data:", e);
      setError("Failed to fetch online players data");
    } finally {
      setIsLoading(false);
    }
  };

  const shouldRefreshData = (data: OnlinePlayersData | null): boolean => {
    if (!data) return true;
    return data.timeStampMs < new Date().getTime() - 1000 * 60 * 4; // 4 minutes
  };

  useEffect(() => {
    // Initial fetch
    if (shouldRefreshData(onlinePlayersData)) {
      fetchOnlinePlayersData();
    }

    // Set up interval for periodic updates (every 5 minutes)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(
      () => {
        if (shouldRefreshData(onlinePlayersData)) {
          fetchOnlinePlayersData();
        }
      },
      1000 * 60 * 5,
    ); // 5 minutes

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency array - we want this to run once and manage its own state

  return {
    onlinePlayersData,
    isLoading,
    error,
    refetch: fetchOnlinePlayersData,
  };
};
