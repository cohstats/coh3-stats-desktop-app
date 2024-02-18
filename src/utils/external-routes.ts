const coh3statsBaseUrl = "https://coh3stats.com"

export const cohdbBaseUrl = "https://cohdb.com"

export const coh3statsPlayerProfile = (profileID: number | string) => {
  return encodeURI(`${coh3statsBaseUrl}/players/${profileID}`)
}

export const cohdbPlayerOverView = () => {
  return encodeURI(`${cohdbBaseUrl}/stats/overview`)
}
