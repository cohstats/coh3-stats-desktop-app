import config from "../config";

export const coh3statsPlayerProfile = (profileID: number | string) => {
  return encodeURI(`${config.COH3STATS_BASE_ULR}/players/${profileID}`);
};

export const cohdbPlayerOverView = () => {
  return encodeURI(`${config.COHDB_BASE_URL}/stats/overview`);
};

export const getMatchDetailRoute = (
  matchId: string | number,
  profileIDs?: Array<string | number>,
) => {
  if (profileIDs && profileIDs.length > 0) {
    return encodeURI(`/matches/${matchId}?profileIDs=${JSON.stringify(profileIDs)}`);
  }

  return encodeURI(`/matches/${matchId}`);
};

export const coh3statsMatchDetail = (
  matchId: string | number,
  profileIDs?: Array<string | number>,
) => {
  const route = getMatchDetailRoute(matchId, profileIDs);
  return `${config.COH3STATS_BASE_ULR}${route}`;
};
