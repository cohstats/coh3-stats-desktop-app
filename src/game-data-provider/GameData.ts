export type GameState = "Closed" | "Menu" | "Loading" | "InGame"

/** Classic means pvp axis vs allies mode like automatch */
export type GameType = "Classic" | "AI" | "Custom"

export type TeamSide = "Axis" | "Allies" | "Mixed"

export type Faction = "soviet" | "aef" | "british" | "german" | "west_german"

export interface RawPlayerData {
    ai: boolean
    faction: Faction
    relic_id: string
    name: string
    position: number
}

export interface RawTeamData {
    players: RawPlayerData[]
    side: TeamSide
}

export interface RawGameData {
    game_state: GameState
    game_type: GameType
    /** Timestamp in log file when the last game started. This timestamp represents the time since coh2 was launched! */
    timestamp: string
    /** Duration in seconds */
    duration: number
    map: string
    win_condition: string
    left: RawTeamData
    right: RawTeamData
}

export interface LogFileNotFoundGameData {
    logFileFound: false
}

export interface LogFileFoundGameData {
    logFileFound: true
    rawGameData: RawGameData
}

export type GameData = LogFileFoundGameData | LogFileNotFoundGameData
