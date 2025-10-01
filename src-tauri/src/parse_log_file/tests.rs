use crate::parse_log_file::{parse_log_file_reverse, GameState, PlayerData, TeamSide};

// TODO: Add more assertions and tests for parsing the log files

#[test]
fn test_parse_log_file_reverse_file_1() {
    // println!("{}", file!());
    let result = parse_log_file_reverse("./test_assets/warnings-1.log".to_string());
    assert_eq!(result.game_state, GameState::Closed);
    // can't compare for some reason
    // assert_eq!(result.game_type, GameType::Custom);

    assert_eq!(result.duration, 2217);
    assert_eq!(result.map, "winter_line_8p_mkii");
    assert_eq!(result.win_condition, "VictoryPoint");

    assert_eq!(result.left.side, TeamSide::Axis);
    assert_eq!(result.right.side, TeamSide::Allies);

    assert_eq!(result.player_name, "Wolfsindis");
    assert_eq!(result.language_code, "en");

    // assert some results
    // assert_eq!(result.len(), 3);
    //  print!("{:#?}", result);
}

#[test]
fn test_parse_log_file_reverse_file_2() {
    println!("{}", file!());
    let result = parse_log_file_reverse("./test_assets/warnings-2.log".to_string());
    assert_eq!(result.game_state, GameState::Closed);

    assert_eq!(result.map, "rural_town_2p_mkii");

    assert_eq!(result.left.side, TeamSide::Axis);
    assert_eq!(result.right.side, TeamSide::Allies);

    assert_eq!(result.player_name, "UMirinBrah?");
    assert_eq!(result.language_code, "fr");

    // print!("{:#?}", result);
}

#[test]
fn test_parse_log_file_reverse_file_3() {
    println!("{}", file!());
    let result = parse_log_file_reverse("./test_assets/warnings-3.log".to_string());
    assert_eq!(result.game_state, GameState::Closed);

    assert_eq!(result.map, "desert_village_2p_mkiii");

    assert_eq!(result.left.side, TeamSide::Allies);
    assert_eq!(result.right.side, TeamSide::Axis);

    assert_eq!(result.player_name, "UMirinBrah?");
    assert_eq!(result.language_code, "fr");

    // print!("{:#?}", result);
}

#[test]
fn test_team_composition() {
    println!("{}", file!());
    let result = parse_log_file_reverse("./test_assets/warnings-4v4-allfactions.log".to_string());
    assert_eq!(result.game_state, GameState::Closed);

    assert_eq!(result.map, "winter_line_8p_mkii");

    assert_eq!(result.left.side, TeamSide::Allies);
    assert_eq!(result.right.side, TeamSide::Axis);

    assert_eq!(result.player_name, "pagep");
    assert_eq!(result.language_code, "en");
    // print!("{:#?}", result);
}

#[test]
fn test_team_composition_mixed_team() {
    println!("{}", file!());
    let result = parse_log_file_reverse("./test_assets/warnings-2v1-mixed.log".to_string());
    assert_eq!(result.game_state, GameState::Closed);

    assert_eq!(result.map, "italy_base");

    assert_eq!(result.left.side, TeamSide::Mixed);
    assert_eq!(result.right.side, TeamSide::Mixed);

    assert_eq!(
        result.right.players[0],
        PlayerData {
            ai: true,
            faction: "germans_campaign".to_string(),
            relic_id: "-1".to_string(),
            name: "CPU - 보통".to_string(),
            position: 1,
            steam_id: "".to_string(),
            rank: -1,
        }
    );

    assert_eq!(
        result.left.players[0],
        PlayerData {
            ai: true,
            faction: "americans_campaign".to_string(),
            relic_id: "-1".to_string(),
            name: "CPU - 보통".to_string(),
            position: 2,
            steam_id: "".to_string(),
            rank: -1,
        }
    );
    assert_eq!(
        result.left.players[1],
        PlayerData {
            ai: false,
            faction: "americans_campaign".to_string(),
            relic_id: "399635".to_string(),
            name: "Baskervilles Blackdog".to_string(),
            position: 0,
            steam_id: "".to_string(),
            rank: -1,
        }
    );

    assert_eq!(result.player_name, "Baskervilles Blackdog");
    assert_eq!(result.language_code, "ko");
    // print!("{:#?}", result);
}
