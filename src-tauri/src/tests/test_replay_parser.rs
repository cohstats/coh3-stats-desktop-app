/// Temporary test module for experimenting with COH3 replay parsing using the vault crate.
/// This is for discovery purposes to understand how to extract commander/battlegroup information.
///
/// Run with: cargo test --package coh3-stats-desktop-app test_parse_temp_replay -- --nocapture
/// Or from src-tauri directory: cargo test test_parse_temp_replay -- --nocapture

use std::fs;
use vault::{Command, Replay};

/// Test function to parse the temporary replay file and print commander/battlegroup information.
/// This test reads from the user's temp.rec file and outputs detailed information about
/// players and their selected battlegroups (commanders).
#[test]
fn test_parse_temp_replay() {
    // Path to the temporary replay file
    let replay_path = r"C:\Users\pagep\Documents\My Games\Company of Heroes 3\playback\temp_15-Feb-26__14_58.rec";

    println!("\n========================================");
    println!("COH3 Replay Parser - Commander Discovery");
    println!("========================================\n");

    // Read the replay file
    let bytes = match fs::read(replay_path) {
        Ok(data) => {
            println!("✓ Successfully read replay file: {}", replay_path);
            println!("  File size: {} bytes\n", data.len());
            data
        }
        Err(e) => {
            println!("✗ Failed to read replay file: {}", e);
            println!("  Path: {}", replay_path);
            println!("\n  Make sure you have a temp.rec file from an active or recent game.");
            return;
        }
    };

    // Parse the replay
    let replay = match Replay::from_bytes(&bytes) {
        Ok(r) => {
            println!("✓ Successfully parsed replay\n");
            r
        }
        Err(e) => {
            println!("✗ Failed to parse replay: {:?}", e);
            return;
        }
    };

    // Print basic replay information
    println!("=== REPLAY INFO ===");
    if let Some(match_id) = replay.matchhistory_id() {
        println!("Match History ID: {}", match_id);
    }
    println!("Game Type: {:?}", replay.game_type());
    println!("Map: {}", replay.map().filename());
    println!();

    // Print player information with battlegroups
    println!("=== PLAYERS & COMMANDERS ===");
    for (i, player) in replay.players().iter().enumerate() {
        println!("\n--- Player {} ---", i + 1);
        println!("Name: {}", player.name());
        println!("Faction: {:?}", player.faction());
        println!("Team: {:?}", player.team());
        println!("Human: {}", player.human());

        if let Some(steam_id) = player.steam_id() {
            println!("Steam ID: {}", steam_id);
        }
        if let Some(profile_id) = player.profile_id() {
            println!("Profile ID: {}", profile_id);
        }

        // Battlegroup (Commander) information
        if let Some(battlegroup_id) = player.battlegroup() {
            println!("Battlegroup (Commander) PBGID: {}", battlegroup_id);
        } else {
            println!("Battlegroup: Not selected yet");
        }

        // Print battlegroup-related commands
        let bg_commands = player.battlegroup_commands();
        if !bg_commands.is_empty() {
            println!("\nBattlegroup Commands ({}):", bg_commands.len());
            for (j, cmd) in bg_commands.iter().enumerate() {
                match cmd {
                    Command::SelectBattlegroup(pbgid) => {
                        println!("  {}. SelectBattlegroup - PBGID: {:?}", j + 1, pbgid);
                    }
                    Command::SelectBattlegroupAbility(pbgid) => {
                        println!("  {}. SelectBattlegroupAbility - PBGID: {:?}", j + 1, pbgid);
                    }
                    Command::UseBattlegroupAbility(pbgid) => {
                        println!("  {}. UseBattlegroupAbility - PBGID: {:?}", j + 1, pbgid);
                    }
                    _ => {
                        println!("  {}. Other: {:?}", j + 1, cmd);
                    }
                }
            }
        }

        // Print messages if any
        let messages = player.messages();
        if !messages.is_empty() {
            println!("\nChat Messages ({}):", messages.len());
            for msg in messages.iter().take(5) {
                println!("  - {:?}", msg);
            }
            if messages.len() > 5 {
                println!("  ... and {} more", messages.len() - 5);
            }
        }
    }

    println!("\n========================================");
    println!("End of Replay Analysis");
    println!("========================================\n");
}

/// Additional test to explore the raw command data structure
#[test]
fn test_explore_commands() {
    let replay_path = r"C:\Users\pagep\Documents\My Games\Company of Heroes 3\playback\temp.rec";

    let bytes = match fs::read(replay_path) {
        Ok(data) => data,
        Err(_) => {
            println!("Skipping test - no temp.rec file found");
            return;
        }
    };

    let replay = match Replay::from_bytes(&bytes) {
        Ok(r) => r,
        Err(_) => {
            println!("Skipping test - failed to parse replay");
            return;
        }
    };

    println!("\n=== COMMAND EXPLORATION ===\n");

    for (i, player) in replay.players().iter().enumerate() {
        println!("Player {}: {} ({:?})", i + 1, player.name(), player.faction());

        let all_commands = player.commands();
        println!("  Total commands: {}", all_commands.len());
        println!("  Build commands: {}", player.build_commands().len());
        println!("  Battlegroup commands: {}", player.battlegroup_commands().len());

        // Show first few commands of each type
        println!("  First 5 commands:");
        for (j, cmd) in all_commands.iter().take(5).enumerate() {
            println!("    {}. {:?}", j + 1, cmd);
        }
        println!();
    }
}

