// SPDX-License-Identifier: AGPL-3.0-or-later
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
//
// TCOAAL Mod Installer - thin Tauri GUI over share-project.js:
//   install    -> apply a .tcoaalmod in place onto the game folder
//   uninstall  -> roll the applied mod back (restores the exact pre-mod state)
// One mod at a time: share-project refuses a second in-place apply until the
// current one is rolled back (it checks for the .tcoaalmod-rollback.zip).

use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};
use tcoaal_desktop_core::{resolve_resource_dir, run_tool, ToolResult};

fn resource_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let bundled = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Cannot resolve resource dir: {e}"))?;
    Ok(resolve_resource_dir(bundled))
}

/// True when the game folder already has a mod applied (a rollback file exists
/// next to its www/). Lets the UI offer Uninstall instead of Install.
#[tauri::command]
fn mod_applied(game: String) -> bool {
    let root = Path::new(&game);
    root.join(".tcoaalmod-rollback.zip").exists()
        || root.join("www").join(".tcoaalmod-rollback.zip").exists()
        // game may itself be the www folder
        || root.parent().map_or(false, |p| p.join(".tcoaalmod-rollback.zip").exists())
}

#[tauri::command]
fn install_mod(app: AppHandle, mod_file: String, game: String) -> Result<ToolResult, String> {
    let dir = resource_dir(&app)?;
    // Apply in place: --out equals --base so share-project overlays only the
    // mod's changed files and writes a rollback archive.
    let args = vec![
        "--apply".into(),
        mod_file,
        "--base".into(),
        game.clone(),
        "--out".into(),
        game,
    ];
    Ok(run_tool(&dir, "share-project.js", &args))
}

#[tauri::command]
fn uninstall_mod(app: AppHandle, game: String) -> Result<ToolResult, String> {
    let dir = resource_dir(&app)?;
    let args = vec!["--rollback".into(), game];
    Ok(run_tool(&dir, "share-project.js", &args))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            mod_applied,
            install_mod,
            uninstall_mod
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
