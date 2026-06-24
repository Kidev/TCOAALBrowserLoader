// SPDX-License-Identifier: AGPL-3.0-or-later
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
//
// TCOAAL Mod Installer: thin Tauri GUI over share-project.js:
//   install    -> apply a .tcoaalmod in place onto the game folder
//   uninstall  -> roll the applied mod back (restores the exact pre-mod state)
// One mod at a time: share-project refuses a second in-place apply until the
// current one is rolled back (it checks for the .tcoaalmod-rollback.zip).

use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};
use tcoaal_desktop_core::{
    find_steam, list_archived, load_catalog, refresh_catalog, remove_archived,
    resolve_resource_dir, run_tool, shared_data_dir, steam_finish_download, steam_start_download,
    ArchivedVersion, CatalogRefresh, DownloadStart, SteamInfo, ToolResult,
};

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

/// Read a mod's supported versions (each variant's label + embedded Steam
/// manifest, if any) so the UI can offer the player the right version.
#[tauri::command]
fn mod_info(app: AppHandle, mod_file: String) -> Result<serde_json::Value, String> {
    let dir = resource_dir(&app)?;
    let res = run_tool(&dir, "share-project.js", &["--info".into(), mod_file]);
    if !res.success {
        return Err(if res.stderr.is_empty() {
            "Could not read the mod file.".into()
        } else {
            res.stderr
        });
    }
    serde_json::from_str(res.stdout.trim()).map_err(|e| format!("Bad mod info: {e}"))
}

// Steam version downloader (shared logic lives in the core crate)

#[tauri::command]
fn steam_detect() -> Option<SteamInfo> {
    find_steam()
}

#[tauri::command]
fn steam_catalog(app: AppHandle) -> Result<serde_json::Value, String> {
    let dir = resource_dir(&app)?;
    Ok(load_catalog(&dir))
}

// Pull the maintained catalog from GitHub (best-effort) and merge the installed
// game + archived versions into the shared cache. Blocking (network), so it runs
// off the main thread.
#[tauri::command]
async fn steam_refresh(app: AppHandle, remote: bool) -> Result<CatalogRefresh, String> {
    let dir = resource_dir(&app)?;
    tauri::async_runtime::spawn_blocking(move || refresh_catalog(&dir, remote))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
fn steam_archived() -> Vec<ArchivedVersion> {
    list_archived(&shared_data_dir())
}

#[tauri::command]
fn steam_remove_archived(key: String) -> Result<(), String> {
    remove_archived(&shared_data_dir(), &key)
}

#[tauri::command]
fn steam_start(manifest: String) -> Result<DownloadStart, String> {
    steam_start_download(&manifest)
}

// Async + spawn_blocking: wait=true can block for many minutes while Steam
// downloads, so it must not run on the main thread.
#[tauri::command]
async fn steam_finish(
    manifest: String,
    name: String,
    version: String,
    buildid: String,
    date: String,
    wait: bool,
) -> Result<ArchivedVersion, String> {
    tauri::async_runtime::spawn_blocking(move || {
        steam_finish_download(&manifest, &name, &version, &buildid, &date, wait)
    })
    .await
    .map_err(|e| e.to_string())?
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            mod_applied,
            install_mod,
            uninstall_mod,
            mod_info,
            steam_detect,
            steam_catalog,
            steam_refresh,
            steam_archived,
            steam_remove_archived,
            steam_start,
            steam_finish
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
