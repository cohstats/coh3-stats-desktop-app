use crate::parse_log_file::{parse_log_file_reverse, GameState, GameType, PlayerData, TeamSide};


// Enhanced test coverage for log file parsing functionality

/// Enhanced comprehensive test for parsing warnings-1.log
/// This test verifies:
/// - Basic game metadata (state, type, duration, map, win condition, timestamp)
/// - Player information (name, steam ID, profile ID, language)
/// - Team composition and sides (Axis vs Allies)
/// - Individual player data (AI status, factions, relic IDs, positions)
/// - Faction distribution validation
/// - Player count verification (4v4 match)
/// - Specific known player names from the log file
#[test]
fn test_parse_log_file_reverse_file_1() {
    let result = parse_log_file_reverse("./test_assets/warnings-1.log".to_string());

    // Basic game information
    assert_eq!(result.game_state, GameState::Closed);
    assert_eq!(result.game_type, GameType::Classic);
    assert_eq!(result.duration, 2217);
    assert_eq!(result.map, "winter_line_8p_mkii");
    assert_eq!(result.win_condition, "VictoryPoint");
    assert_eq!(result.timestamp, "12:26:42.682");

    // Player information
    assert_eq!(result.player_name, "Wolfsindis");
    assert_eq!(result.player_steam_id, "76561198023526153");
    assert_eq!(result.player_profile_id, "");
    assert_eq!(result.language_code, "en");

    // Team composition
    assert_eq!(result.left.side, TeamSide::Axis);
    assert_eq!(result.right.side, TeamSide::Allies);

    // Verify team sizes (8 players total in 4v4)
    assert_eq!(result.left.players.len(), 4);
    assert_eq!(result.right.players.len(), 4);

    // Verify specific player data for the main player (Wolfsindis)
    let wolfsindis_player = result.left.players.iter()
        .find(|p| p.name == "Wolfsindis")
        .expect("Should find Wolfsindis in left team");

    assert_eq!(wolfsindis_player.ai, false);
    assert_eq!(wolfsindis_player.faction, "germans");
    assert_eq!(wolfsindis_player.relic_id, "3264");
    assert_eq!(wolfsindis_player.position, 0);
    assert_eq!(wolfsindis_player.steam_id, "");
    assert_eq!(wolfsindis_player.rank, -1);

    // Verify all players are human (no AI)
    for player in &result.left.players {
        assert_eq!(player.ai, false, "Left team player {} should not be AI", player.name);
    }
    for player in &result.right.players {
        assert_eq!(player.ai, false, "Right team player {} should not be AI", player.name);
    }

    // Verify faction distribution on left team (Axis)
    let left_factions: Vec<&str> = result.left.players.iter().map(|p| p.faction.as_str()).collect();
    assert!(left_factions.contains(&"germans"));
    assert!(left_factions.contains(&"afrika_korps"));

    // Verify faction distribution on right team (Allies)
    let right_factions: Vec<&str> = result.right.players.iter().map(|p| p.faction.as_str()).collect();
    assert!(right_factions.contains(&"americans"));
    assert!(right_factions.contains(&"british_africa"));

    // Verify all players have valid relic IDs (non-empty for human players)
    for player in &result.left.players {
        assert!(!player.relic_id.is_empty(), "Player {} should have a relic ID", player.name);
    }
    for player in &result.right.players {
        assert!(!player.relic_id.is_empty(), "Player {} should have a relic ID", player.name);
    }

    // Verify specific known players from the log
    let expected_left_players = vec!["Wolfsindis", "Le mérovingien", "BLITZKRIEG BOB", "joker95174"];
    let expected_right_players = vec!["Treiben", "McLovin", "既定之天命", "蹦嚓蹦嚓蹦嚓"];

    let left_names: Vec<&str> = result.left.players.iter().map(|p| p.name.as_str()).collect();
    let right_names: Vec<&str> = result.right.players.iter().map(|p| p.name.as_str()).collect();

    for expected_name in expected_left_players {
        assert!(left_names.contains(&expected_name), "Left team should contain player {}", expected_name);
    }

    for expected_name in expected_right_players {
        assert!(right_names.contains(&expected_name), "Right team should contain player {}", expected_name);
    }
}

/// Enhanced comprehensive test for parsing warnings-2.log
/// This test verifies:
/// - 1v1 match parsing (Classic game type)
/// - French language detection
/// - Basic game metadata validation
/// - Player data for both human players
/// - Team composition (Axis vs Allies)
/// - Specific player verification
#[test]
fn test_parse_log_file_reverse_file_2() {
    let result = parse_log_file_reverse("./test_assets/warnings-2.log".to_string());

    // Basic game information
    assert_eq!(result.game_state, GameState::Closed);
    assert_eq!(result.game_type, GameType::Classic);
    assert_eq!(result.duration, 1330);
    assert_eq!(result.map, "rural_town_2p_mkii");
    assert_eq!(result.win_condition, "VictoryPoint");
    assert_eq!(result.timestamp, "20:10:32.152");

    // Player information
    assert_eq!(result.player_name, "UMirinBrah?");
    assert_eq!(result.player_steam_id, "76561198005864560");
    assert_eq!(result.player_profile_id, "");
    assert_eq!(result.language_code, "fr");

    // Team composition (1v1 match)
    assert_eq!(result.left.side, TeamSide::Axis);
    assert_eq!(result.right.side, TeamSide::Allies);
    assert_eq!(result.left.players.len(), 1);
    assert_eq!(result.right.players.len(), 1);

    // Verify left team player (Axis)
    let left_player = &result.left.players[0];
    assert_eq!(left_player.ai, false);
    assert_eq!(left_player.faction, "germans");
    assert_eq!(left_player.relic_id, "1968");
    assert_eq!(left_player.name, "Imperial Dane");
    assert_eq!(left_player.position, 0);
    assert_eq!(left_player.steam_id, "");
    assert_eq!(left_player.rank, -1);

    // Verify right team player (Allies) - this is the main player
    let right_player = &result.right.players[0];
    assert_eq!(right_player.ai, false);
    assert_eq!(right_player.faction, "british_africa");
    assert_eq!(right_player.relic_id, "16432");
    assert_eq!(right_player.name, "UMirinBrah?");
    assert_eq!(right_player.position, 1);
    assert_eq!(right_player.steam_id, "");
    assert_eq!(right_player.rank, -1);

    // Verify all players are human
    for player in &result.left.players {
        assert_eq!(player.ai, false, "Left team player {} should not be AI", player.name);
    }
    for player in &result.right.players {
        assert_eq!(player.ai, false, "Right team player {} should not be AI", player.name);
    }

    // Verify faction assignment is correct for team sides
    assert!(result.left.players.iter().any(|p| p.faction == "germans"));
    assert!(result.right.players.iter().any(|p| p.faction == "british_africa"));
}

/// Enhanced comprehensive test for parsing warnings-3.log
/// This test verifies:
/// - AI vs Human match parsing (AI game type)
/// - Custom win condition (ccm_annihilation)
/// - French language detection
/// - AI player detection and validation
/// - Human vs AI team composition
/// - Zero duration handling (incomplete game)
#[test]
fn test_parse_log_file_reverse_file_3() {
    let result = parse_log_file_reverse("./test_assets/warnings-3.log".to_string());

    // Basic game information
    assert_eq!(result.game_state, GameState::Closed);
    assert_eq!(result.game_type, GameType::AI);
    assert_eq!(result.duration, 0); // Game didn't complete
    assert_eq!(result.map, "desert_village_2p_mkiii");
    assert_eq!(result.win_condition, "ccm_annihilation");
    assert_eq!(result.timestamp, "19:41:10.348");

    // Player information
    assert_eq!(result.player_name, "UMirinBrah?");
    assert_eq!(result.player_steam_id, "76561198005864560");
    assert_eq!(result.player_profile_id, "");
    assert_eq!(result.language_code, "fr");

    // Team composition (Human vs AI)
    assert_eq!(result.left.side, TeamSide::Allies);
    assert_eq!(result.right.side, TeamSide::Axis);
    assert_eq!(result.left.players.len(), 1);
    assert_eq!(result.right.players.len(), 1);

    // Verify left team player (Human - Allies)
    let left_player = &result.left.players[0];
    assert_eq!(left_player.ai, false);
    assert_eq!(left_player.faction, "americans");
    assert_eq!(left_player.relic_id, "16432");
    assert_eq!(left_player.name, "UMirinBrah?");
    assert_eq!(left_player.position, 0);
    assert_eq!(left_player.steam_id, "");
    assert_eq!(left_player.rank, -1);

    // Verify right team player (AI - Axis)
    let right_player = &result.right.players[0];
    assert_eq!(right_player.ai, true);
    assert_eq!(right_player.faction, "germans");
    assert_eq!(right_player.relic_id, "-1");
    assert_eq!(right_player.name, "IA normale");
    assert_eq!(right_player.position, 1);
    assert_eq!(right_player.steam_id, "");
    assert_eq!(right_player.rank, -1);

    // Verify AI vs Human composition
    assert_eq!(result.left.players.iter().filter(|p| p.ai).count(), 0);
    assert_eq!(result.right.players.iter().filter(|p| p.ai).count(), 1);
    assert_eq!(result.left.players.iter().filter(|p| !p.ai).count(), 1);
    assert_eq!(result.right.players.iter().filter(|p| !p.ai).count(), 0);

    // Verify AI player has expected characteristics
    let ai_player = result.right.players.iter().find(|p| p.ai).unwrap();
    assert_eq!(ai_player.relic_id, "-1");
    assert!(ai_player.name.contains("IA") || ai_player.name.contains("CPU"));
}

/// Enhanced comprehensive test for parsing warnings-4v4-allfactions.log
/// This test verifies:
/// - 4v4 match parsing with all faction types
/// - Classic game type validation
/// - English language detection
/// - All human players (no AI)
/// - Faction diversity within teams
/// - Specific player data validation
/// - Team balance verification
#[test]
fn test_team_composition() {
    let result = parse_log_file_reverse("./test_assets/warnings-4v4-allfactions.log".to_string());

    // Basic game information
    assert_eq!(result.game_state, GameState::Closed);
    assert_eq!(result.game_type, GameType::Classic);
    assert_eq!(result.duration, 867);
    assert_eq!(result.map, "winter_line_8p_mkii");
    assert_eq!(result.win_condition, "VictoryPoint");
    assert_eq!(result.timestamp, "12:04:08.599");

    // Player information
    assert_eq!(result.player_name, "pagep");
    assert_eq!(result.player_steam_id, "76561198034318060");
    assert_eq!(result.player_profile_id, "");
    assert_eq!(result.language_code, "en");

    // Team composition (4v4 match)
    assert_eq!(result.left.side, TeamSide::Allies);
    assert_eq!(result.right.side, TeamSide::Axis);
    assert_eq!(result.left.players.len(), 4);
    assert_eq!(result.right.players.len(), 4);

    // Verify all players are human (no AI)
    for player in &result.left.players {
        assert_eq!(player.ai, false, "Left team player {} should not be AI", player.name);
        assert!(!player.relic_id.is_empty(), "Player {} should have a relic ID", player.name);
    }
    for player in &result.right.players {
        assert_eq!(player.ai, false, "Right team player {} should not be AI", player.name);
        assert!(!player.relic_id.is_empty(), "Player {} should have a relic ID", player.name);
    }

    // Verify faction distribution on left team (Allies)
    let left_factions: Vec<&str> = result.left.players.iter().map(|p| p.faction.as_str()).collect();
    assert!(left_factions.contains(&"americans"));
    assert!(left_factions.contains(&"british_africa"));

    // Verify faction distribution on right team (Axis)
    let right_factions: Vec<&str> = result.right.players.iter().map(|p| p.faction.as_str()).collect();
    assert!(right_factions.contains(&"germans"));
    assert!(right_factions.contains(&"afrika_korps"));

    // Verify specific known players from the log
    let expected_left_players = vec!["老肉片", "Saving Ryan", "hhh3350", "Smiley"];
    let expected_right_players = vec!["Brothers in Trenches", "pagep", "白yu黑", "K21"];

    let left_names: Vec<&str> = result.left.players.iter().map(|p| p.name.as_str()).collect();
    let right_names: Vec<&str> = result.right.players.iter().map(|p| p.name.as_str()).collect();

    for expected_name in expected_left_players {
        assert!(left_names.contains(&expected_name), "Left team should contain player {}", expected_name);
    }

    for expected_name in expected_right_players {
        assert!(right_names.contains(&expected_name), "Right team should contain player {}", expected_name);
    }

    // Verify the main player (pagep) is in the right team
    let pagep_player = result.right.players.iter()
        .find(|p| p.name == "pagep")
        .expect("Should find pagep in right team");

    assert_eq!(pagep_player.ai, false);
    assert_eq!(pagep_player.faction, "germans");
    assert_eq!(pagep_player.relic_id, "228");
    assert_eq!(pagep_player.position, 3);
}

/// Enhanced comprehensive test for parsing warnings-2v1-mixed.log
/// This test verifies:
/// - Campaign/custom scenario parsing
/// - Mixed team composition (human + AI on same team)
/// - Custom game type validation
/// - Korean language detection
/// - AI and human player differentiation
/// - Campaign faction handling
/// - Profile ID extraction
/// - Zero duration handling (incomplete game)
#[test]
fn test_team_composition_mixed_team() {
    let result = parse_log_file_reverse("./test_assets/warnings-2v1-mixed.log".to_string());

    // Basic game information
    assert_eq!(result.game_state, GameState::Closed);
    assert_eq!(result.game_type, GameType::Custom);
    assert_eq!(result.duration, 0); // Campaign/custom game didn't complete
    assert_eq!(result.map, "italy_base");
    assert_eq!(result.win_condition, "no_win_condition");
    assert_eq!(result.timestamp, "22:25:05.887");

    // Player information
    assert_eq!(result.player_name, "Baskervilles Blackdog");
    assert_eq!(result.player_steam_id, "76561198122738366");
    assert_eq!(result.player_profile_id, "399635");
    assert_eq!(result.language_code, "ko");

    // Team composition (Mixed teams with AI and humans)
    assert_eq!(result.left.side, TeamSide::Mixed);
    assert_eq!(result.right.side, TeamSide::Mixed);
    assert_eq!(result.left.players.len(), 2);
    assert_eq!(result.right.players.len(), 1);

    // Verify right team player (AI)
    assert_eq!(result.right.players[0], PlayerData {
        ai: true,
        faction: "germans_campaign".to_string(),
        relic_id: "-1".to_string(),
        name: "CPU - 보통".to_string(),
        position: 1,
        steam_id: "".to_string(),
        rank: -1,
    });

    // Verify left team players (AI + Human)
    assert_eq!(result.left.players[0], PlayerData {
        ai: true,
        faction: "americans_campaign".to_string(),
        relic_id: "-1".to_string(),
        name: "CPU - 보통".to_string(),
        position: 2,
        steam_id: "".to_string(),
        rank: -1,
    });

    assert_eq!(result.left.players[1], PlayerData {
        ai: false,
        faction: "americans_campaign".to_string(),
        relic_id: "399635".to_string(),
        name: "Baskervilles Blackdog".to_string(),
        position: 0,
        steam_id: "".to_string(),
        rank: -1,
    });

    // Verify AI vs Human distribution
    let total_ai = result.left.players.iter().filter(|p| p.ai).count() +
                   result.right.players.iter().filter(|p| p.ai).count();
    let total_human = result.left.players.iter().filter(|p| !p.ai).count() +
                      result.right.players.iter().filter(|p| !p.ai).count();

    assert_eq!(total_ai, 2);
    assert_eq!(total_human, 1);

    // Verify AI players have expected characteristics
    for team in [&result.left, &result.right] {
        for player in &team.players {
            if player.ai {
                assert_eq!(player.relic_id, "-1");
                assert!(player.name.contains("CPU") || player.name.contains("보통"));
                assert!(player.faction.contains("campaign"));
            } else {
                assert_ne!(player.relic_id, "-1");
                assert!(!player.name.contains("CPU"));
            }
        }
    }

    // Verify campaign factions are used
    let all_factions: Vec<&str> = result.left.players.iter()
        .chain(result.right.players.iter())
        .map(|p| p.faction.as_str())
        .collect();

    assert!(all_factions.iter().all(|f| f.contains("campaign")));
    assert!(all_factions.contains(&"americans_campaign"));
    assert!(all_factions.contains(&"germans_campaign"));
}
