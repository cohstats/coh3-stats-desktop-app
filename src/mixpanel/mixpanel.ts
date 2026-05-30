import mixpanel from "mixpanel-browser";
import { getClientId, getVersion } from "./propertyGetters";
import config from "../config";

// We are sending analytics only in prod or if it's enabled here
const shouldSendAnalytics =
  // process is accessible only thanks to VITE env replacement
  process.env.NODE_ENV === "development" ? config.SEND_ANALYTICS_IN_DEV : true;

if (shouldSendAnalytics) {
  mixpanel.init("bf92acb0810b9e7d4a49e63efc41433d");
}

/**
 * Get common properties that should be included in every event
 */
const getCommonProperties = async () => ({
  distinct_id: await getClientId(),
  version: await getVersion(),
  ms_store_edition: config.MS_STORE_EDITION,
});

/**
 * The events for Mixpanel
 */
const events = {
  init: async (): Promise<void> => {
    if (!shouldSendAnalytics) return;
    mixpanel.track("app_init", await getCommonProperties());
  },
  open_about: async (): Promise<void> => {
    if (!shouldSendAnalytics) return;
    mixpanel.track("open_about", await getCommonProperties());
  },
  open_settings: async (): Promise<void> => {
    if (!shouldSendAnalytics) return;

    mixpanel.track("open_settings", await getCommonProperties());
  },
  open_replays: async (): Promise<void> => {
    if (!shouldSendAnalytics) return;

    mixpanel.track("open_replays", await getCommonProperties());
  },
  open_recent_games: async (): Promise<void> => {
    if (!shouldSendAnalytics) return;

    mixpanel.track("open_recent_games", await getCommonProperties());
  },
  settings_changed: async (setting: string, value?: string | number): Promise<void> => {
    if (!shouldSendAnalytics) return;

    mixpanel.track("settings_changed", {
      ...(await getCommonProperties()),
      setting,
      value,
    });
  },
  map_stats: async (
    matchup: string,
    map_name: string,
    factionMatrixString: string,
    displayed: boolean,
  ): Promise<void> => {
    if (!shouldSendAnalytics) return;

    mixpanel.track("map_stats", {
      ...(await getCommonProperties()),
      matchup,
      map_name,
      factionMatrixString,
      displayed,
    });
  },
  open_leaderboards: async (): Promise<void> => {
    if (!shouldSendAnalytics) return;

    mixpanel.track("open_leaderboards", await getCommonProperties());
  },
};

export default events;
