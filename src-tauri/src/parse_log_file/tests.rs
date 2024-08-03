use crate::parse_log_file::{parse_log_file_reverse, GameState, TeamSide};


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
    print!("{:#?}", result);
}
