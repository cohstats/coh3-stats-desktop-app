import { PlayerCounters, PlayerReport } from "./data-types";
import config from "../config";

/**
 * Parse the counters string from match data into a structured object
 */
export const parsePlayerCounters = (countersString: string): PlayerCounters => {
  try {
    const parsed = JSON.parse(countersString);
    return {
      dmgdone: parsed.dmgdone || 0,
      ekills: parsed.ekills || 0,
      edeaths: parsed.edeaths || 0,
      sqkill: parsed.sqkill || 0,
      sqprod: parsed.sqprod || 0,
      sqlost: parsed.sqlost || 0,
      vkill: parsed.vkill || 0,
      vprod: parsed.vprod || 0,
      vlost: parsed.vlost || 0,
      vabnd: parsed.vabnd || 0,
      vcap: parsed.vcap || 0,
      pcap: parsed.pcap || 0,
      plost: parsed.plost || 0,
      precap: parsed.precap || 0,
      abil: parsed.abil || 0,
      cabil: parsed.cabil || 0,
      totalcmds: parsed.totalcmds || 0,
      gt: parsed.gt || 0,
    };
  } catch (error) {
    console.error("Failed to parse player counters:", error);
    // Return default values if parsing fails
    return {
      dmgdone: 0,
      ekills: 0,
      edeaths: 0,
      sqkill: 0,
      sqprod: 0,
      sqlost: 0,
      vkill: 0,
      vprod: 0,
      vlost: 0,
      vabnd: 0,
      vcap: 0,
      pcap: 0,
      plost: 0,
      precap: 0,
      abil: 0,
      cabil: 0,
      totalcmds: 0,
      gt: 0,
    };
  }
};

/**
 * Format game time from seconds to MM:SS format
 */
export const getMatchDurationGameTime = (gameTimeSeconds: number): string => {
  const minutes = Math.floor(gameTimeSeconds / 60);
  const seconds = gameTimeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Converts the slashes to the correct ones
 * We don't need to use 3rd party module for this
 * @param path
 */
const internalSlash = (path: string): string => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  if (isExtendedLengthPath) {
    return path;
  }
  return path.replace(/\\/g, "/");
};

/**
 * Get the path of the icon on our CDN hosting for images
 * @param iconPath The path of the icon, can be full path or just filename.
 * @param folder By default we look for whole path, but if you can't find the icon, you can try using "export_flatten" folder.
 */
export const getIconsPathOnCDN = (
  iconPath: string,
  folder: "export" | "export_flatten" | "maps" = "export",
): string => {
  // If we are in export_flatten folder, we need to remove the whole path and just keep filename
  if (folder === "export_flatten") {
    iconPath = iconPath.split(/[\\/]/).pop() || "";
  }

  if (iconPath.endsWith(".png")) {
    iconPath = iconPath.replace(".png", ".webp");
  } else if (!iconPath.endsWith(".png") && !iconPath.endsWith(".webp")) {
    iconPath += ".webp";
  }

  // Remove double // in case we have them in the path
  const urlPath = `/${folder}/${iconPath}`.replace(/\/\//g, "/");

  return internalSlash(`${config.CDN_ASSETS_HOSTING}${urlPath}`);
};

/**
 * Process player reports to ensure counters are parsed
 */
export const processPlayerReports = (playerReports: any[]): PlayerReport[] => {
  return playerReports.map((player) => ({
    ...player,
    counters:
      typeof player.counters === "string"
        ? parsePlayerCounters(player.counters)
        : player.counters || parsePlayerCounters("{}"),
  }));
};
