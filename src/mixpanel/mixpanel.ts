import mixpanel from "mixpanel-browser"
import { getClientId, getVersion } from "./propertyGetters"
import config from "../config"

// We are sending analytics only in prod or if it's enabled here
const shouldSendAnalytics =
  // process is accessible only thanks to VITE env replacement
  process.env.NODE_ENV === "development" ? config.SEND_ANALYTICS_IN_DEV : true

if (shouldSendAnalytics) {
  mixpanel.init("bf92acb0810b9e7d4a49e63efc41433d")
}

/**
 * The events for Mixpanel
 */
const events = {
  init: async (): Promise<void> => {
    if (!shouldSendAnalytics) return
    mixpanel.track("app_init", {
      distinct_id: await getClientId(),
      version: await getVersion(),
    })
  },
  open_about: async (): Promise<void> => {
    if (!shouldSendAnalytics) return
    mixpanel.track("open_about", {
      distinct_id: await getClientId(),
      version: await getVersion(),
    })
  },
  open_settings: async (): Promise<void> => {
    if (!shouldSendAnalytics) return

    mixpanel.track("open_settings", {
      distinct_id: await getClientId(),
      version: await getVersion(),
    })
  },
  open_replays: async (): Promise<void> => {
    if (!shouldSendAnalytics) return

    mixpanel.track("open_replays", {
      distinct_id: await getClientId(),
      version: await getVersion(),
    })
  },
  connect_coh_db: async (): Promise<void> => {
    if (!shouldSendAnalytics) return

    mixpanel.track("cohdb_connect_account", {
      distinct_id: await getClientId(),
      version: await getVersion(),
    })
  },
  disconnect_coh_db: async (): Promise<void> => {
    if (!shouldSendAnalytics) return

    mixpanel.track("cohdb_disconnect_account", {
      distinct_id: await getClientId(),
      version: await getVersion(),
    })
  },
  replay_uploaded: async (status: string): Promise<void> => {
    if (!shouldSendAnalytics) return

    mixpanel.track("replays_uploaded", {
      distinct_id: await getClientId(),
      version: await getVersion(),
      status,
    })
  },
  settings_changed: async (
    setting: string,
    value?: string | number
  ): Promise<void> => {
    if (!shouldSendAnalytics) return

    mixpanel.track("settings_changed", {
      distinct_id: await getClientId(),
      version: await getVersion(),
      setting,
      value,
    })
  },
  map_stats: async (
    matchup: string,
    map_name: string,
    factionMatrixString: string,
    displayed: boolean
  ): Promise<void> => {
    if (!shouldSendAnalytics) return

    mixpanel.track("map_stats", {
      distinct_id: await getClientId(),
      version: await getVersion(),
      matchup,
      map_name,
      factionMatrixString,
      displayed,
    })
  },
}

export default events
