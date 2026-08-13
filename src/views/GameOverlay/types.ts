import { FullPlayerData, TeamSide } from "../../game-data-provider/GameData-types";
import { KnownFriendsGroup } from "../../utils/team-grouping";

/** Must match `game_overlay::OVERLAY_WINDOW_LABEL` in the Rust side. */
export const GAME_OVERLAY_WINDOW_LABEL = "game-overlay";

/** Main window -> overlay window: the matchup to draw. */
export const GAME_OVERLAY_DATA_EVENT = "game-overlay:data";
/** Overlay window -> main window: "I'm mounted, re-send if you already pushed". */
export const GAME_OVERLAY_READY_EVENT = "game-overlay:ready";

export type OverlayTeamKind = "arranged" | "friends" | "random";

export interface OverlayTeam {
  side: TeamSide;
  players: FullPlayerData[];
  teamKind: OverlayTeamKind;
  /** Friends groups (with colours) when `teamKind === "friends"`, otherwise empty. */
  groups: KnownFriendsGroup[];
  /** ELO of the arranged team, when one was found. */
  teamElo?: number;
}

export interface GameOverlayPayload {
  uniqueID: string;
  map: string;
  left: OverlayTeam;
  right: OverlayTeam;
}
