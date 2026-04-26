import React, { createContext, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MapStatsDataType } from "../utils/data-types";

// Create the context with types
const MapStatsContext = createContext<{
  data: MapStatsDataType | null;
  loading: boolean;
  error: string | null;
}>({
  data: null,
  loading: true,
  error: null,
});

// Create the provider component
const MapStatsProvider = ({ children }: React.PropsWithChildren) => {
  const [data, setData] = useState<MapStatsDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelayMultiplier = 5000;

    const fetchMapStats = async () => {
      try {
        const result = await invoke<MapStatsDataType | null>("get_map_stats");

        if (!isMounted) return;

        if (result) {
          setData(result);
          setLoading(false);
        } else if (retryCount < maxRetries) {
          // Data not ready yet, retry after delay
          retryCount++;
          setTimeout(fetchMapStats, retryCount * retryDelayMultiplier);
        } else {
          // Max retries reached, data is null
          setLoading(false);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(`Error fetching map stats: ${err}`);
        setLoading(false);
      }
    };

    fetchMapStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <MapStatsContext.Provider value={{ data, loading, error }}>
      {children}
    </MapStatsContext.Provider>
  );
};

export { MapStatsContext, MapStatsProvider };
