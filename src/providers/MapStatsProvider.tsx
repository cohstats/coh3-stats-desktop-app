import React, { createContext, useState, useEffect } from "react";
import { fetch } from "@tauri-apps/plugin-http";
import config from "../config";
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data from an API
    (async () => {
      try {
        const response = await fetch(`${config.COH3STATS_BASE_ULR}/api/getLatestPatchMapStats`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        setData((await response.json()) as any);
      } catch (error) {
        setError(`Error fetching data: ${error}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <MapStatsContext.Provider value={{ data, loading, error }}>
      {children}
    </MapStatsContext.Provider>
  );
};

export { MapStatsContext, MapStatsProvider };
