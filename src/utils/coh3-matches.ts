import {
  ProcessedMatch,
  RawMatchHistoryReportResult,
  RawMatchObject,
  RawMatchUrl,
  RawProfile,
} from "./data-types";
import { fetchPlayerMatches, platformType } from "./coh3-relic-api";
import { parsePlayerCounters } from "./match-detail-helpers";

const extractPlayerIDsInMatch = (singleMatchData: RawMatchObject): Array<number> => {
  const playerIds = [];

  for (const player of singleMatchData["matchhistoryreportresults"]) {
    playerIds.push(player["profile_id"]);
  }

  return playerIds;
};

const cleanupSingleMatch = (singleMatchData: Partial<RawMatchObject>): Record<string, any> => {
  // delete fields we don't need to track
  delete singleMatchData["options"]; // Don't know what this field does, probably don't need it
  delete singleMatchData["slotinfo"]; // Don't know what this field does, probably don't need it
  delete singleMatchData["observertotal"]; // We don't care about this
  // delete singleMatchData["matchurls"]; // Don't know, don't care

  for (const player of singleMatchData[
    "matchhistoryreportresults"
  ] as Partial<RawMatchHistoryReportResult>[]) {
    delete player["xpgained"];
    delete player["matchstartdate"];
    delete player["matchhistory_id"];
  }

  return singleMatchData;
};

/**
 * Returns the profile based on it's ID from the list of profiles
 * @param profileId
 * @param profiles
 */
const findProfile = (
  profileId: number,
  profiles: Array<RawProfile>,
): Record<string, any> | undefined => {
  return profiles.find((profile: Record<string, any>) => {
    return profile["profile_id"] == profileId;
  });
};

const appendMatchHistoryMembersToMatchHistoryReportResults = (
  singleMatchData: Record<string, any>,
) => {
  for (const player of singleMatchData["matchhistoryreportresults"]) {
    player["matchhistorymember"] = singleMatchData["matchhistorymember"].find(
      (member: Record<string, any>) => {
        return member["profile_id"] == player["profile_id"];
      },
    );

    const playerMatchHisMember = player["matchhistorymember"];
    // Remove unnecessary data
    delete playerMatchHisMember["matchhistory_id"];
    delete playerMatchHisMember["profile_id"];
    delete playerMatchHisMember["teamid"];
    delete playerMatchHisMember["race_id"];
  }

  return singleMatchData;
};

/**
 * This function transforms the objects in the profiles for them to be possible to
 * better process / analyze and search in in the DB.
 *
 * Returns steam IDs. This should be theoretically put into the separate function
 * but we can calculate it in one way to save some time. lul
 *
 * @param singleMatchObject
 * @param profiles
 */
const appendProfilesToMatchHistoryReportResult = (
  singleMatchObject: Record<string, any>,
  profiles: Array<RawProfile>,
) => {
  for (const playerResult of singleMatchObject["matchhistoryreportresults"]) {
    playerResult["profile"] = findProfile(playerResult["profile_id"], profiles);
  }
};

/**
 * MUTATES THE OBJECT
 * @param singleMatchObject
 */
const convertMatchUrls = (singleMatchObject: Record<string, any>) => {
  singleMatchObject["matchurls"] = singleMatchObject["matchurls"].map(
    (matchurlObject: RawMatchUrl) => {
      return {
        profile_id: matchurlObject["profile_id"],
        //  "key": "replay_files_repo/coh3/profile_20927/f94d995f2320b3cd8bcf7baf5b3d7b3c8913df4eab34448541e469fb0c3c3527",
        // parse only the last part of the key
        key: matchurlObject["key"].split("/").pop(),
      };
    },
  );

  return singleMatchObject;
};

/**
 * Parse counters strings in match history report results
 * MUTATES THE OBJECT
 * @param singleMatchObject
 */
const parseCountersInMatchResults = (singleMatchObject: Record<string, any>) => {
  for (const player of singleMatchObject["matchhistoryreportresults"]) {
    if (typeof player["counters"] === "string") {
      player["counters"] = parsePlayerCounters(player["counters"]);
    }
  }
  return singleMatchObject;
};

/***
 * This is the main function for processing and preparing the single match to be saved in the DB.
 *
 * @param singleMatchData
 * @param profiles
 * @param platform
 */
const convertMatchObject = (
  singleMatchData: RawMatchObject,
  profiles: Array<RawProfile>,
  platform: platformType,
): ProcessedMatch => {
  const profileIDs = extractPlayerIDsInMatch(singleMatchData);

  // Do all the transformations on the single match object
  const cleanedMatch = cleanupSingleMatch(singleMatchData);
  appendProfilesToMatchHistoryReportResult(cleanedMatch, profiles);
  appendMatchHistoryMembersToMatchHistoryReportResults(cleanedMatch);
  parseCountersInMatchResults(cleanedMatch);
  convertMatchUrls(cleanedMatch);

  // Add platform to the match
  cleanedMatch["platform"] = platform;

  // This is important we are storing profile IDs on the main object so we can filter in DB based on this
  cleanedMatch["profile_ids"] = profileIDs;
  // Remove the array, it's already on the profiles
  delete cleanedMatch["matchhistorymember"];

  return cleanedMatch as ProcessedMatch;
};

const getPlayerMatches = async (relicProfileID: string) => {
  const data = await fetchPlayerMatches(relicProfileID, "steam");

  let allMatches = data["matchHistoryStats"];
  let profiles = data["profiles"];
  let platform = data.platform;

  // Filter out non-automatch games (only keep ranked 1v1, 2v2, 3v3, 4v4)
  const automatchGames = allMatches.filter((match) => {
    return (
      (match.matchtype_id >= 1 && match.matchtype_id <= 4) ||
      (match.matchtype_id >= 20 && match.matchtype_id <= 23)
    );
  });

  // Transform the match objects, this removes unnecessary data, preparers additional information in single match object
  return automatchGames.map((match) => convertMatchObject(match, profiles, platform));
};

export { getPlayerMatches };
