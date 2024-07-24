import config from "../config"

export const coh3statsPlayerProfile = (profileID: number | string) => {
  return encodeURI(`${config.COH3STATS_BASE_ULR}/players/${profileID}`)
}

export const cohdbPlayerOverView = () => {
  return encodeURI(`${config.COHDB_BASE_URL}/stats/overview`)
}
