import { useCallback, useEffect, useRef, useState } from "react";
import {
  FullGameData,
  FullPlayerData,
  GameState,
  RawGameData,
  RawTeamData,
} from "./GameData-types";
import { useRawGameData } from "./useRawGameData";
import { fetch } from "@tauri-apps/api/http";
import config from "../config";
import { MantineColor } from "@mantine/core";
import { renderStreamerHTML } from "../streamer-overlay/renderStreamerOverlay";
import { useLogFilePath, usePlayerProfileID } from "./configValues";
import { playSound as playSoundFunc } from "../game-found-sound/playSound";
import { getPlaySound } from "../game-found-sound/configValues";
import { calculatePlayerPlayedFactionStats, calculateTotalGamesForPlayer } from "../utils/utils";
import { logFileRaceTypeToRaceType, leaderboardsIDAsObject } from "../coh3-data";
import { leaderBoardType, RawLaddersObject } from "../coh3-types";

const PLAYER_COLOR_OBJECT: { left: MantineColor[]; right: MantineColor[] } = {
  left: ["blue", "blue", "blue", "blue"],
  right: ["pink", "green", "red", "purple"],
};

export const useFullGameData = () => {
  const { rawGameData } = useRawGameData();
  const [playerProfileID, setPlayerProfileID] = usePlayerProfileID();
  const [logFilePath] = useLogFilePath();
  const lastGameUniqueKeyRef = useRef<string>("");
  const lastGameStateRef = useRef<GameState>(null);
  const [gameData, setGameData] = useState<FullGameData>();

  const generateUniqueGameKey = useCallback((rawGameData: RawGameData) => {
    return (
      rawGameData.timestamp +
      rawGameData.map +
      rawGameData.win_condition +
      rawGameData.left.players
        .concat(rawGameData.right.players)
        .map((player) => player.relic_id)
        .join()
    );
  }, []);

  useEffect(() => {
    if (rawGameData?.player_profile_id) {
      setPlayerProfileID(rawGameData.player_profile_id);
    }
  }, [rawGameData?.player_profile_id]);

  useEffect(() => {
    const refineSide = async (side: RawTeamData, left: boolean, rawGameData: RawGameData) => {
      const gameMode = (side.players.length + "v" + side.players.length) as leaderBoardType;
      const onlyRealPlayers = side.players.filter((player) => !player.ai);

      let responses = await Promise.all(
        onlyRealPlayers.map((player) =>
          fetch(
            config.BASE_RELIC_API_URL +
              "/community/leaderboard/getpersonalstat?profile_ids=[" +
              player.relic_id +
              "]&title=coh3",
            {
              method: "GET",
            },
          ),
        ),
      );

      let mergedResponses = responses.map((response, index) => ({
        response,
        relicID: onlyRealPlayers[index].relic_id,
        faction: logFileRaceTypeToRaceType[onlyRealPlayers[index].faction],
      }));

      let refinedPlayerData = side.players.map(
        (player, index): FullPlayerData => ({
          ai: player.ai,
          faction: logFileRaceTypeToRaceType[player.faction] || player.faction,
          relicID: player.relic_id,
          name: player.name,
          position: player.position,
          color: left ? PLAYER_COLOR_OBJECT.left[index] : PLAYER_COLOR_OBJECT.right[index],
          self: player.name === rawGameData.player_name,
        }),
      );

      mergedResponses.forEach((response) => {
        const data = response.response.data as RawLaddersObject;
        if (data.result && data.result.message === "SUCCESS") {
          const refinedPlayerIndex = refinedPlayerData.findIndex(
            (player) => player.relicID === response.relicID,
          );
          if (refinedPlayerIndex === -1) {
            return;
          }
          const member = data.statGroups[0].members.find(
            (member) => member.profile_id + "" === response.relicID,
          );
          if (member) {
            refinedPlayerData[refinedPlayerIndex].country = member.country;
            refinedPlayerData[refinedPlayerIndex].steamID = member.name.split("/").at(-1);
            refinedPlayerData[refinedPlayerIndex].level = member.level;
            refinedPlayerData[refinedPlayerIndex].xp = member.xp;
          }
          const leaderBoardsAsObject = data.leaderboardStats.reduce(
            (acc, leaderboard) => {
              acc[leaderboard.leaderboard_id] = leaderboard;
              return acc;
            },
            {} as Record<string, RawLaddersObject["leaderboardStats"][0]>,
          );

          const leaderboardID = leaderboardsIDAsObject[gameMode][response.faction];
          const leaderboard = leaderBoardsAsObject[leaderboardID];

          refinedPlayerData[refinedPlayerIndex].totalGames =
            calculateTotalGamesForPlayer(leaderBoardsAsObject);
          refinedPlayerData[refinedPlayerIndex].factionStats = calculatePlayerPlayedFactionStats(
            leaderBoardsAsObject,
            response.faction,
          );

          if (leaderboard) {
            refinedPlayerData[refinedPlayerIndex].disputes = leaderboard.disputes;
            refinedPlayerData[refinedPlayerIndex].drops = leaderboard.drops;
            refinedPlayerData[refinedPlayerIndex].lastMatchDate = leaderboard.lastmatchdate;
            refinedPlayerData[refinedPlayerIndex].losses = leaderboard.losses;
            refinedPlayerData[refinedPlayerIndex].rank = leaderboard.rank;
            refinedPlayerData[refinedPlayerIndex].rankLevel = leaderboard.ranklevel;
            refinedPlayerData[refinedPlayerIndex].rankTotal = leaderboard.ranktotal;
            refinedPlayerData[refinedPlayerIndex].rating = leaderboard.rating;
            // refinedPlayerData[refinedPlayerIndex].regionRank =
            //   leaderboard.regionrank
            // refinedPlayerData[refinedPlayerIndex].regionRankTotal =
            //   leaderboard.regionranktotal
            refinedPlayerData[refinedPlayerIndex].streak = leaderboard.streak;
            refinedPlayerData[refinedPlayerIndex].wins = leaderboard.wins;
          }
        }
      });
      return refinedPlayerData;
    };

    const refineLogFileData = async (rawGameData: RawGameData) => {
      const playSound = await getPlaySound();
      if (playSound && rawGameData.game_state === "Loading") {
        playSoundFunc();
      }
      try {
        const [leftRefined, rightRefined] = await Promise.all([
          refineSide(rawGameData.left, true, rawGameData),
          refineSide(rawGameData.right, false, rawGameData),
        ]);

        const newGameData: FullGameData = {
          uniqueID: generateUniqueGameKey(rawGameData),
          state: rawGameData.game_state,
          type: rawGameData.game_type,
          timestamp: rawGameData.timestamp,
          duration: rawGameData.duration,
          map: rawGameData.map,
          winCondition: rawGameData.win_condition,
          left: {
            side: rawGameData.left.side,
            players: leftRefined,
          },
          right: {
            side: rawGameData.right.side,
            players: rightRefined,
          },
          language_code: rawGameData.language_code,
        };
        renderStreamerHTML(newGameData);
        setGameData(newGameData);
      } catch (e: any) {
        console.error(e);
      }
    };

    // when raw data from log file changes check if its a new game with the generated unique key and refine data external api data
    if (logFilePath !== undefined && rawGameData) {
      if (lastGameUniqueKeyRef.current !== generateUniqueGameKey(rawGameData)) {
        refineLogFileData(rawGameData);
        lastGameUniqueKeyRef.current = generateUniqueGameKey(rawGameData);
      } else if (lastGameStateRef.current !== rawGameData.game_state) {
        if (gameData) {
          lastGameStateRef.current = rawGameData.game_state;
          const newGameData = gameData;
          newGameData.state = rawGameData.game_state;
          renderStreamerHTML(newGameData);
          setGameData(newGameData);
        }
      }
    }
  }, [logFilePath, rawGameData]);

  const reloadLogFile = useCallback(() => {
    lastGameUniqueKeyRef.current = "";
  }, []);

  return {
    rawGameData,
    gameData,
    reloadLogFile,
  };
};
