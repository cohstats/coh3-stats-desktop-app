import React, { createContext, useState, useEffect, useRef, useContext } from "react";
import { fetch } from "@tauri-apps/plugin-http";
import { getNumberOfOnlinePlayersSteamUrl } from "../utils/steam-api";

interface OnlinePlayersData {
  playerCount: number;
  timeStampMs: number;
}

interface SteamOnlinePlayersContextType {
  onlinePlayersData: OnlinePlayersData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Create the context with types
const SteamOnlinePlayersContext = createContext<SteamOnlinePlayersContextType>({
  onlinePlayersData: null,
  isLoading: false,
  error: null,
  refetch: async () => {},
});

// Custom hook to use the Steam online players context
export const useSteamOnlinePlayers = () => useContext(SteamOnlinePlayersContext);

// Provider component
export const SteamOnlinePlayersProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
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

  const contextValue: SteamOnlinePlayersContextType = {
    onlinePlayersData,
    isLoading,
    error,
    refetch: fetchOnlinePlayersData,
  };

  return (
    <SteamOnlinePlayersContext.Provider value={contextValue}>
      {children}
    </SteamOnlinePlayersContext.Provider>
  );
};
