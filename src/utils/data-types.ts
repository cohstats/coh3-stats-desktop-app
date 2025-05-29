import { platformType } from "./coh3-relic-api";
import { raceID, leaderBoardType } from "../coh3-types";

export type AnalysisObjectType = {
  german: { wins: number; losses: number };
  american: { wins: number; losses: number };
  dak: { wins: number; losses: number };
  british: { wins: number; losses: number };
  matchCount: number;
  gameTime: number;
  gameTimeSpread: Record<string, number>;
  maps: Record<string, number>;
  factionMatrix: Record<string, { wins: number; losses: number }>;
};

export type MapAnalysisObjectType = Record<string, AnalysisObjectType>;

export interface MapStatsDataObject {
  "1v1": MapAnalysisObjectType;
  "2v2": MapAnalysisObjectType;
  "3v3": MapAnalysisObjectType;
  "4v4": MapAnalysisObjectType;
}

export interface MapStatsDataType {
  latestPatchInfo: {
    from: string;
    to: string;
    value: string;
    label: string;
    group: string;
  };
  mapStats: {
    analysis: MapStatsDataObject;
    fromTimeStampSeconds: number;
    toTimeStampSeconds: number;
    type: "mapStats";
    wasMissingData: boolean;
    filters?: Array<string>;
  };
  mapInfo: Record<
    string,
    {
      name: string;
    }
  >;
}

export interface RawMatchHistoryResponse {
  matchHistoryStats: RawMatchObject[];
  profiles: RawProfile[];
  platform: platformType;
}

export interface RawMatchObject {
  id: number;
  creator_profile_id: number;
  mapname: string;
  maxplayers: number;
  matchtype_id: number;
  options: string;
  slotinfo: string;
  description: string;
  startgametime: number;
  completiontime: number;
  observertotal: number;
  matchhistoryreportresults: RawMatchHistoryReportResult[];
  matchhistoryitems: RawMatchHistoryItem[];
  matchurls: RawMatchUrl[];
  matchhistorymember: RawMatchHistoryMember[];
}

export interface RawMatchHistoryReportResult {
  matchhistory_id: number;
  profile_id: number;
  resulttype: number;
  teamid: number;
  race_id: number;
  xpgained: number;
  counters: string;
  matchstartdate: number;
}

export interface RawMatchHistoryItem {
  profile_id: number;
  matchhistory_id: number;
  iteminstance_id: number;
  itemdefinition_id: number;
  durabilitytype: number;
  durability: number;
  metadata: string;
  itemlocation_id: number;
}

export interface ProcessedMatchHistoryItem {
  profile_id: number;
  itemdefinition_id: number;
  itemlocation_id: number;
}

export interface RawMatchHistoryMember {
  matchhistory_id: number;
  profile_id: number;
  race_id: number;
  statgroup_id: number;
  teamid: number;
  wins: number;
  losses: number;
  streak: number;
  arbitration: number;
  outcome: number;
  oldrating: number;
  newrating: number;
  reporttype: number;
}

export interface RawMatchUrl {
  profile_id: number; //  "profile_id": 20927,
  key: string; // "key": "replay_files_repo/coh3/profile_20927/f94d995f2320b3cd8bcf7baf5b3d7b3c8913df4eab34448541e469fb0c3c3527",
  size: number; // "size": 1297401,
  datatype: number; //   "datatype": 0
}

export interface RawProfile {
  profile_id: number;
  name: string;
  alias: string;
  personal_statgroup_id: number;
  xp: number;
  level: number;
  leaderboardregion_id: number;
  country: string;
}

interface ProcessedProfile {
  name: string;
  alias: string;
  personal_statgroup_id: number;
  xp: number;
  level: number;
  leaderboardregion_id: number;
  country: string;
}

interface ProcessedMatchHistoryMember {
  statgroup_id: number;
  wins: number;
  losses: number;
  streak: number;
  arbitration: number;
  outcome: number;
  oldrating: number;
  newrating: number;
  reporttype: number;
}

/**
 * Parsed counters object from the match data
 */
export interface PlayerCounters {
  dmgdone: number;
  ekills: number;
  edeaths: number;
  sqkill: number;
  sqprod: number;
  sqlost: number;
  vkill: number;
  vprod: number;
  vlost: number;
  vabnd: number;
  vcap: number;
  pcap: number;
  plost: number;
  precap: number;
  abil: number;
  cabil: number;
  totalcmds: number;
  gt: number; // game time in seconds
}

/**
 * This is the object inside matchhistoryreportresults
 */
export interface PlayerReport {
  profile_id: number;
  resulttype: number;
  teamid: number;
  race_id: raceID;
  counters: PlayerCounters;
  profile: ProcessedProfile;
  matchhistorymember: ProcessedMatchHistoryMember;
}

export interface ProcessedMatch {
  id: number;
  creator_profile_id: number;
  platform: platformType;
  mapname: string;
  maxplayers: number;
  matchtype_id: number;
  description: string;
  startgametime: number;
  completiontime: number;
  matchhistoryreportresults: Array<PlayerReport>;
  matchhistoryitems: Array<ProcessedMatchHistoryItem>;
  profile_ids: Array<number>;
}

/**
 * Team details interfaces for COH3 Stats API
 */
export interface CHSTeamCore {
  player_ids: Array<number>;
  players: Array<{
    profile_id: number;
    alias: string;
    country: string;
  }>;
  type: leaderBoardType | "other";
  side: "axis" | "allies";
  elo: number;
  bestElo: number;
  w: number; // Wins
  l: number; // Losses
  s: number; // Streak
  t: number; // Total
  lmTS: number | null; // Last Match Linux Timestamp
  mh: Array<{
    m_id: number;
    w: boolean;
    eloChange: number;
    enemyElo: number;
    ts: number;
  }>; // Match history
}

export interface TeamDetails extends CHSTeamCore {
  id: string;
}
