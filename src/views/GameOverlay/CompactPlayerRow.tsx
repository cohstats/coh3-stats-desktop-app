import React from "react";
import { FullPlayerData } from "../../game-data-provider/GameData-types";
import classes from "./GameOverlay.module.css";

/** The friends-group bar in front of the row, same idea as the one in `PlayerCard`. */
const GroupIndicator: React.FC<{ color?: string }> = ({ color }) => (
  <span
    className={classes.groupIndicator}
    style={{ background: color ?? "transparent" }}
    aria-hidden
  />
);

/**
 * One player line in the in-game overlay.
 *
 * Assets come from the app bundle (`public/`), never from remote URLs like the OBS
 * streamer overlay does - the overlay has to work offline and has no http permission.
 */
export const CompactPlayerRow: React.FC<{ player: FullPlayerData; groupColor?: string }> = ({
  player,
  groupColor,
}) => {
  if (player.ai) {
    return (
      <div className={classes.row}>
        <GroupIndicator />
        <img
          className={classes.faction}
          src={`/factions/${player.faction}.webp`}
          alt={player.faction}
        />
        <span />
        <span className={classes.name}>{player.name}</span>
        <span className={`${classes.rank} ${classes.dim}`}>AI</span>
        <span />
        <span />
        <span />
      </div>
    );
  }

  const rank = player.rank !== undefined && player.rank > 0 ? `#${player.rank}` : "—";
  const wins = player.wins ?? 0;
  const losses = player.losses ?? 0;
  const played = wins + losses;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : undefined;

  return (
    <div className={`${classes.row} ${player.self ? classes.rowSelf : ""}`}>
      <GroupIndicator color={groupColor} />
      <img
        className={classes.faction}
        src={`/factions/${player.faction}.webp`}
        alt={player.faction}
      />
      {player.country ? (
        <img
          className={classes.flag}
          src={`/flags/4x3/${player.country}.svg`}
          alt={player.country}
        />
      ) : (
        <span />
      )}
      <span className={classes.name}>{player.name}</span>
      <span className={`${classes.rank} ${rank === "—" ? classes.dim : ""}`}>{rank}</span>
      <span className={classes.elo}>{player.rating ?? "—"}</span>
      <span className={classes.winRate}>
        {winRate !== undefined ? `${winRate}%` : <span className={classes.dim}>—</span>}
      </span>
      <span className={classes.record}>
        {played > 0 ? (
          <>
            <span className={classes.win}>{wins}</span>
            <span className={classes.dim}> / </span>
            <span className={classes.loss}>{losses}</span>
          </>
        ) : (
          <span className={classes.dim}>—</span>
        )}
      </span>
    </div>
  );
};
