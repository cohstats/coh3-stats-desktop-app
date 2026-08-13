import React from "react";
import { CompactPlayerRow } from "./CompactPlayerRow";
import { OverlayTeam } from "./types";
import classes from "./GameOverlay.module.css";

/**
 * Same colour and label semantics as `ArrangedTeamCard`, but as plain CSS - the
 * overlay does not load Mantine's stylesheet, so the group colours are resolved to
 * the equivalent Mantine shade here.
 */
const BADGE_COLORS: Record<string, string> = {
  blue: "#228be6",
  gray: "#868e96",
  green: "#40c057",
  orange: "#fd7e14",
  violet: "#7950f2",
  pink: "#e64980",
  cyan: "#15aabf",
};

const badgeColor = (color?: string) => BADGE_COLORS[color ?? "gray"] ?? BADGE_COLORS.gray;

const TeamBadges: React.FC<{ team: OverlayTeam }> = ({ team }) => {
  if (team.teamKind === "arranged") {
    return (
      <div className={classes.badges}>
        <span className={classes.badge} style={{ background: BADGE_COLORS.blue }}>
          Arranged Team
        </span>
        {team.teamElo !== undefined && (
          <span className={classes.badgeElo}>ELO {team.teamElo}</span>
        )}
      </div>
    );
  }

  if (team.teamKind === "friends" && team.groups.length > 0) {
    return (
      <div className={classes.badges}>
        {team.groups.map((group, index) => (
          <span
            key={index}
            className={classes.badge}
            style={{ background: badgeColor(group.color) }}
          >
            Friends Group
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={classes.badges}>
      <span className={classes.badge} style={{ background: BADGE_COLORS.gray }}>
        Random Team
      </span>
    </div>
  );
};

const TeamColumn: React.FC<{ team: OverlayTeam }> = ({ team }) => (
  <div className={classes.column}>
    <TeamBadges team={team} />
    {team.players.map((player) => (
      <CompactPlayerRow key={`${player.relicID}-${player.position}`} player={player} />
    ))}
  </div>
);

export const CompactMatchup: React.FC<{
  left: OverlayTeam;
  right: OverlayTeam;
  map: string;
}> = ({ left, right, map }) => (
  <div className={classes.panel}>
    <div className={classes.header}>
      <span>Grenadier</span>
      <span>·</span>
      <span>{map}</span>
    </div>
    <div className={classes.teams}>
      <TeamColumn team={left} />
      <div className={classes.versus}>VS</div>
      <TeamColumn team={right} />
    </div>
  </div>
);
