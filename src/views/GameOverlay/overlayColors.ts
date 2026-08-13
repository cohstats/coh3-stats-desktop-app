import { KnownFriendsGroup } from "../../utils/team-grouping";

/**
 * Same colour semantics as the Mantine badges in `ArrangedTeamCard` / `PlayerCard`, but
 * as plain hex - the overlay does not load Mantine's stylesheet, so the group colours are
 * resolved to the equivalent Mantine shade here.
 */
export const BADGE_COLORS: Record<string, string> = {
  blue: "#228be6",
  gray: "#868e96",
  green: "#40c057",
  orange: "#fd7e14",
  violet: "#7950f2",
  pink: "#e64980",
  cyan: "#15aabf",
};

export const badgeColor = (color?: string) => BADGE_COLORS[color ?? "gray"] ?? BADGE_COLORS.gray;

/**
 * Colour of the friends-group indicator for a player, or undefined when the player is
 * not part of any detected group. Mirrors `getPlayerTeamColor` in the Game view.
 */
export const playerGroupColor = (
  relicID: string,
  groups: KnownFriendsGroup[],
): string | undefined => {
  const playerId = parseInt(relicID, 10);
  if (isNaN(playerId)) return undefined;

  const group = groups.find((g) => g.playerIds.includes(playerId));
  return group ? badgeColor(group.color) : undefined;
};
