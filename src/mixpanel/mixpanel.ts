import mixpanel from "mixpanel-browser"
import { getClientId, getVersion } from "./propertyGetters"

mixpanel.init("bf92acb0810b9e7d4a49e63efc41433d")

/**
 * The events for Mixpanel
 */
const events = {
  init: async (): Promise<void> => {
    mixpanel.track("app_init", {
      distinct_id: await getClientId(),
      version: await getVersion(),
    })
  },
  open_about: async (): Promise<void> => {
    mixpanel.track("open_about", {
      distinct_id: await getClientId(),
      version: await getVersion(),
    })
  },
  open_settings: async (): Promise<void> => {
    mixpanel.track("open_settings", {
      distinct_id: await getClientId(),
      version: await getVersion(),
    })
  },
  settings_changed: async (
    setting: string,
    value?: string | number
  ): Promise<void> => {
    mixpanel.track("settings_changed", {
      distinct_id: await getClientId(),
      version: await getVersion(),
      setting,
      value,
    })
  },
}

export default events
