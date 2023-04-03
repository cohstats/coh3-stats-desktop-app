import { MantineColor } from "@mantine/core"
import { logFileRaceType, raceType } from "coh3-data-types-library"

export type GameState = "Closed" | "Menu" | "Loading" | "InGame"

/** Classic means pvp axis vs allies mode like automatch */
export type GameType = "Classic" | "AI" | "Custom"

export type TeamSide = "Axis" | "Allies" | "Mixed"

export interface RawPlayerData {
  ai: boolean
  faction: logFileRaceType
  relic_id: string
  name: string
  position: number
  steam_id: string
  rank: number
}

export interface RawTeamData {
  players: RawPlayerData[]
  side: TeamSide
}

export interface RawGameData {
  game_state: GameState
  game_type: GameType
  /** Timestamp in log file when the last game started. This timestamp represents the time since coh3 was launched! */
  timestamp: string
  /** Duration in seconds */
  duration: number
  map: string
  win_condition: string
  left: RawTeamData
  right: RawTeamData
  player_name: string
  player_steam_id: string
  language_code: string
}

export interface FullPlayerData {
  ai: boolean
  self: boolean
  faction: raceType
  relicID: string
  name: string
  position: number
  steamID?: string
  country?: string
  level?: number
  xp?: number
  disputes?: number
  drops?: number
  lastMatchDate?: number
  losses?: number
  rank?: number
  rankLevel?: number
  rankTotal?: number
  rating?: number
  regionRank?: number
  regionRankTotal?: number
  streak?: number
  wins?: number
  color: MantineColor
}

export interface FullTeamData {
  players: FullPlayerData[]
  side: TeamSide
  //averageRating: number
  //averageRank: number
  //averageWinRatio: number
}

export interface FullGameData {
  uniqueID: string
  state: GameState
  type: GameType
  timestamp: string
  duration: number
  map: string
  winCondition: string
  left: FullTeamData
  right: FullTeamData
  language_code: string
}

export interface LogFileFoundGameData {
  gameData: FullGameData
  reloadLogFile: () => void
}

export type GameData = LogFileFoundGameData | undefined
