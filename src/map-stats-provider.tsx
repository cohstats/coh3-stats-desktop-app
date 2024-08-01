import React, { createContext, useState, useEffect } from "react"
import { fetch } from "@tauri-apps/api/http"
import config from "./config"

// Create the context with types
const MapStatsContext = createContext<{
  data: any
  loading: boolean
  error: string | null
}>({
  data: {},
  loading: true,
  error: null,
})

// Create the provider component
const MapStatsProvider = ({ children }: React.PropsWithChildren) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch data from an API
    ;(async () => {
      try {
        const response = await fetch(
          `${config.COH3STATS_BASE_ULR}/api/getLatestPatchMapStats`
        )
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }

        setData(response.data as any)
      } catch (error) {
        setError(`Error fetching data: ${error}`)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <MapStatsContext.Provider value={{ data, loading, error }}>
      {children}
    </MapStatsContext.Provider>
  )
}

export { MapStatsContext, MapStatsProvider }
