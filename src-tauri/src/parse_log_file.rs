use serde::{Deserialize, Serialize};
use rev_lines::RevLines;
use nom;
use std::io::BufReader;
use std::fs::File;

#[derive(Serialize, Deserialize, Clone)]
pub enum GameState {
  Closed,
  Menu,
  Loading,
  InGame
}

#[derive(Serialize, Deserialize, Clone)]
pub enum GameType {
  Classic,
  AI,
  Custom
}

#[derive(Serialize, Deserialize, Clone, PartialEq)]
pub enum TeamSide {
  Axis,
  Allies,
  Mixed
}

#[derive(Serialize, Deserialize, Clone)]
pub struct PlayerData {
  pub ai: bool,
  pub faction: String,
  pub relic_id: String,
  pub name: String,
  pub position: u8,
  pub steam_id: String,
  pub rank: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TeamData {
  pub players: Vec<PlayerData>,
  pub side: TeamSide,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct LogFileData {
  pub game_state: GameState,
  pub game_type: GameType,
  pub timestamp: String,
  pub duration: u64,
  pub map: String,
  pub win_condition: String,
  pub left: TeamData,
  pub right: TeamData
}

#[tauri::command]
pub fn parse_log_file_reverse(path: String) -> LogFileData {
  let file = File::open(path).unwrap();
  let rev_lines = RevLines::new(BufReader::new(file)).unwrap();
  let mut game_running = true;
  let mut game_loading = false;
  let mut game_started = false;
  let mut game_ended = false;
  let mut map = "".to_string();
  let mut win_condition = "".to_string();
  let mut timestamp = "".to_string();
  let mut game_duration: u64 = 0;
  let mut left: Vec<PlayerData> = Vec::new();
  let mut right: Vec<PlayerData> = Vec::new();
  // Read log file in reverse order line by line
  for line in rev_lines {
    if nom::bytes::complete::tag::<&str, &str, ()>("Application closed")(line.as_str()).is_ok() {
      println!("Found application closed");
      game_running = false;
      continue;
    }
    
    if let Ok((tail, parsed_timestamp)) = get_timestamped_line(line.as_str()) {
      if is_game_start_line(tail) {
        timestamp = parsed_timestamp.to_string();
        //println!("Timestamp {}", timestamp);
        
      }
      if let Ok((tail, _)) = get_match_started_line(tail) {
        println!("Match started {}", tail);
        if let Ok((tail, relic_id)) = nom::bytes::complete::take_until1::<&str, &str, ()>(" ")(tail) {
          if let Ok((tail, _)) = nom::bytes::complete::tag::<&str, &str, ()>(" ")(tail) {
            println!("Match started relic {}", relic_id);
            if let Ok((tail, steam_id)) = nom::bytes::complete::take_until1::<&str, &str, ()>("], ")(tail) {
              if let Ok((tail, _)) = nom::bytes::complete::tag::<&str, &str, ()>("], slot =  ")(tail) {
                println!("Match started steam {}", steam_id);
                if let Ok((tail, position_str)) = nom::bytes::complete::take_until1::<&str, &str, ()>(", ranking =   ")(tail) {
                  if let Ok((rank_str, _)) = nom::bytes::complete::tag::<&str, &str, ()>(", ranking =   ")(tail) {
                    if let Ok(position) = position_str.parse::<u8>() {
                      if let Ok(rank) = rank_str.parse::<i64>() {
                        println!("Match started slot {}", position);
                        println!("Match started rank {}", rank);
                        if let Some(index) = left.iter().position(|p| *p.relic_id == relic_id.to_string()) {
                          left[index].steam_id = steam_id.to_string();
                          left[index].rank = rank;
                        }
                        if let Some(index) = right.iter().position(|p| *p.relic_id == relic_id.to_string()) {
                          right[index].steam_id = steam_id.to_string();
                          right[index].rank = rank;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if let Ok((tail, param)) = get_param_line(tail) {
        if param == "GAME" {
          if let Ok((tail, sub_param)) = get_game_sub_param(tail) {
            if sub_param == "Scenario" {
              if let Ok((parsed_map, _)) = get_map_name(tail) {
                map = parsed_map.to_string();
                //println!("Map {}", map);
              }
            } else if sub_param == "Win Condition Name" {
              win_condition = tail.trim().to_string();
              game_loading = true;
              //println!("Win Condition {}", win_condition);
            } else if sub_param == "Starting mission" {
              game_started = true;
            } else if sub_param == "Human Player" {
              if let Ok((without_space, _)) = get_without_leading_space(tail) {
                if let Ok((tail, position_str)) = nom::bytes::complete::take_until1::<&str, &str, ()>(" ")(without_space) {
                  if let Ok((tail, _)) = nom::bytes::complete::tag::<&str, &str, ()>(" ")(tail) {
                    if let Ok((faction, front)) = get_last_separated_by_space(tail) {
                      if let Ok((side_str, front)) = get_last_separated_by_space(front) {
                        if let Ok((relic_id, user_name)) = get_last_separated_by_space(front) {
                          if let Ok(position) = position_str.parse::<u8>() {
                            if let Ok(side) = side_str.parse::<u8>() {
                              let player_data = PlayerData {
                                ai: false,
                                position,
                                faction: faction.to_string(),
                                relic_id: relic_id.to_string(),
                                name: user_name.to_string(),
                                steam_id: "".to_string(),
                                rank: -1,
                              };
                              if side == 0 {
                                left.push(player_data);
                              } else {
                                right.push(player_data);
                              }
                              //println!("{}", position);
                              //println!("{}", faction);
                              //println!("{}", side);
                              //println!("{}", relic_id);
                              //println!("{}", user_name);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } else if sub_param == "AI Player" {
              if let Ok((without_space, _)) = get_without_leading_space(tail) {
                if let Ok((tail, position_str)) = nom::bytes::complete::take_until1::<&str, &str, ()>(" ")(without_space) {
                  if let Ok((tail, _)) = nom::bytes::complete::tag::<&str, &str, ()>(" ")(tail) {
                    if let Ok((faction, front)) = get_last_separated_by_space(tail) {
                      if let Ok((side_str, front)) = get_last_separated_by_space(front) {
                        if let Ok((_, user_name)) = get_last_separated_by_space(front) {
                          if let Ok(position) = position_str.parse::<u8>() {
                            if let Ok(side) = side_str.parse::<u8>() {
                              let player_data = PlayerData {
                                ai: true,
                                position,
                                faction: faction.to_string(),
                                relic_id: "-1".to_string(),
                                name: user_name.to_string(),
                                steam_id: "".to_string(),
                                rank: -1,
                              };
                              if side == 0 {
                                left.push(player_data);
                              } else {
                                right.push(player_data);
                              }
                              //println!("{}", position);
                              //println!("{}", faction);
                              //println!("{}", side);
                              //println!("{}", user_name);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else if param == "MOD" {
          if let Ok((duration_str, _)) = get_game_over(tail) {
            if let Ok(duration) = duration_str.parse::<u64>() {
              game_duration = duration/8;
              //println!("Game Duration {}s", duration/8);
            }
            game_ended = true;
          }
        }
      }
    } 
  }
  let game_state = determine_game_state(game_running, game_ended, game_loading, game_started);
  let left_team = get_team_data(left);
  let right_team = get_team_data(right);
  LogFileData {
    game_state,
    game_type: determine_game_type(&left_team, &right_team),
    timestamp,
    duration: game_duration,
    map,
    win_condition,
    left: left_team,
    right: right_team,
  }
}

fn determine_game_state(running: bool, ended: bool, loading: bool, started: bool) -> GameState {
  if !running {
    return GameState::Closed;
  } else if ended || !loading {
    return GameState::Menu;
  } else if started {
    return GameState::InGame;
  } else if loading {
    return GameState::Loading;
  }
  GameState::Menu
}

fn determine_game_type(left_team: &TeamData, right_team: &TeamData) -> GameType {
  let left_ai_count = get_ai_count(&left_team);
  let right_ai_count = get_ai_count(&right_team);
  if left_team.side != TeamSide::Mixed && right_team.side != TeamSide::Mixed && left_team.side != right_team.side {
    if (left_ai_count + right_ai_count) == 0 {
      return GameType::Classic
    } else if (left_ai_count == 0 && right_ai_count == right_team.players.len()) || (right_ai_count == 0 && left_ai_count == left_team.players.len()) {
      return GameType::AI
    }
  }
  GameType::Custom
}

fn get_ai_count(team: &TeamData) -> usize {
  let mut count: usize = 0;
  for player in &team.players {
    if player.ai {
      count += 1;
    }
  }
  count
}

fn get_team_data(players: Vec<PlayerData>) -> TeamData {
  let mut mixed = false;
  let mut last = TeamSide::Mixed;
  for player in &players {
    if player.faction == "german" || player.faction == "west_german" {
      if last == TeamSide::Allies {
        mixed = true;
        break;
      }
      last = TeamSide::Axis;
    } else {
      if last == TeamSide::Axis {
        mixed = true;
        break;
      }
      last = TeamSide::Allies;
    }
  }
  if mixed {
    return TeamData { players: players, side: TeamSide::Mixed }
  }
  TeamData { players: players, side: last }
}

// look for blocks like this:
// (I) [11:43:31.404] [000007332]: 
// (E) [11:44:07.831] [000007332]: 
// if searched tags are found
// take time code -> eg: 11:44:07.831
// and return remaining line
// if not stop with error as soon as tag cannot be found
fn get_timestamped_line(line: &str) -> nom::IResult<&str, &str> {
  let (tail, _) = nom::bytes::complete::take_until1("[")(line)?;
  let (tail, _) = nom::bytes::complete::tag("[")(tail)?;
  let (tail, time_code) = nom::bytes::complete::take_until1("]")(tail)?;
  let (tail, _) = nom::bytes::complete::tag("]")(tail)?;
  let (tail, _) = nom::bytes::complete::take_until1("]: ")(tail)?;
  let (tail, _) = nom::bytes::complete::tag("]: ")(tail)?;
  Ok((tail,time_code))
}

fn is_game_start_line(timestamped_tail: &str) -> bool {
  nom::bytes::complete::tag::<_, _, nom::error::Error<_>>("WorldwideAutomatch2Service::Process - Got into game successfully")(timestamped_tail).is_ok()
}

fn get_match_started_line(timestamped_tail: &str) -> nom::IResult<&str, ()> {
  let (tail, _) = nom::bytes::complete::tag("Match Started - [")(timestamped_tail)?;
  Ok((tail, ()))
}

fn get_param_line(timestamped_tail: &str) -> nom::IResult<&str, &str> {
  let (tail, param) = nom::bytes::complete::take_until1(" -- ")(timestamped_tail)?;
  let (tail, _) = nom::bytes::complete::tag(" -- ")(tail)?;
  Ok((tail,param))
}

fn get_game_sub_param(game_param_tail: &str) -> nom::IResult<&str, &str> {
  let (tail, sub_param) = nom::bytes::complete::take_until1(":")(game_param_tail)?;
  let (tail, _) = nom::bytes::complete::tag(":")(tail)?;
  Ok((tail,sub_param))
}

fn get_map_name(scenario_tail: &str) -> nom::IResult<&str, &str> {
  let (tail, front) = nom::bytes::complete::take_until1("\\")(scenario_tail)?;
  let (tail, _) = nom::bytes::complete::tag("\\")(tail)?;
  if let Ok((tail, front)) = get_map_name(tail) {
    return Ok((tail,front))
  }
  Ok((tail,front))
}

fn get_game_over(mod_param_tail: &str) -> nom::IResult<&str, &str> {
  let (duration, game_over_message) = nom::bytes::complete::tag("Game Over at frame ")(mod_param_tail)?;
  Ok((duration, game_over_message))
}

fn get_last_separated_by_space(line: &str) -> nom::IResult<&str, &str> {
  let (tail, front) = nom::bytes::complete::take_until1(" ")(line)?;
  let (tail, _) = nom::bytes::complete::tag(" ")(tail)?;
  if let Ok((tail, _)) = get_last_separated_by_space(tail) {
    return Ok((tail, &line[0..(line.len() - tail.len() - 1)]))
  }
  Ok((tail, front))
}

fn get_without_leading_space(line: &str) -> nom::IResult<&str, ()> {
  let (without_space, _) = nom::bytes::complete::tag(" ")(line)?;
  Ok((without_space, ()))
}