const config = {
  CDN_ASSETS_HOSTING: "https://cdn.coh3stats.com",
  COHDB_BASE_URL: "https://cohdb.com",
  COH3STATS_BASE_ULR: "https://coh3stats.com",
  COH3STATS_STATS_MAPS: "https://coh3stats.com/stats/maps",
  DISCORD_JOIN_LINK: "https://discord.gg/4Bj2y84WAR",
  SEND_ANALYTICS_IN_DEV: false,
  BASE_RELIC_API_URL: "https://coh3-api.reliclink.com",
  BASE_CLOUD_FUNCTIONS_PROXY_URL: "https://cache.coh3stats.com",
  COHS3STATS_API_UPDATE_ROUTE: "https://coh3stats.com/api/appUpdateRouteV2",
  // Updater can be disabled via VITE_DISABLE_UPDATER environment variable
  // This is used for Microsoft Store builds where updates are handled by the store
  UPDATER_DISABLED: import.meta.env.VITE_DISABLE_UPDATER === "true",
};

export default config;
