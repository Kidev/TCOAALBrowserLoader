// SPDX-License-Identifier: AGPL-3.0-or-later
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
//
// TCOAAL Mod Creator: thin Tauri GUI over the repo's tools/:
//   extract-project.js  -> create an editable project from a game folder
//   play.js             -> run the project in true browser mode (dev loop)
//   pack-project.js     -> re-pack the edited project to a playable www
//   share-project.js    -> build a shareable .tcoaalmod diff (one+ base games)
// All heavy lifting runs in the bundled Node; Rust only spawns it.

use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;

use tauri::{AppHandle, Manager, State};
use tcoaal_desktop_core::{
    find_steam, list_archived, load_catalog, node_binary, refresh_catalog, remove_archived,
    resolve_resource_dir, run_tool, shared_data_dir, steam_finish_download, steam_start_download,
    tool_path, ArchivedVersion, CatalogRefresh, DownloadStart, SteamInfo, ToolResult,
};

/// Holds the background `play.js` dev server child so it can be stopped.
#[derive(Default)]
struct PlayState(Mutex<Option<Child>>);

fn resource_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let bundled = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Cannot resolve resource dir: {e}"))?;
    Ok(resolve_resource_dir(bundled))
}

#[tauri::command]
fn extract_project(
    app: AppHandle,
    www: String,
    out: String,
    extra_args: Vec<String>,
) -> Result<ToolResult, String> {
    let dir = resource_dir(&app)?;
    let mut args = vec![
        "--www".into(),
        www,
        "--out".into(),
        out,
        "--force".into(),
    ];
    args.extend(extra_args);
    Ok(run_tool(&dir, "extract-project.js", &args))
}

#[tauri::command]
fn pack_project(app: AppHandle, project: String, out: String) -> Result<ToolResult, String> {
    let dir = resource_dir(&app)?;
    let args = vec![
        "--project".into(),
        project,
        "--out".into(),
        out,
        "--force".into(),
    ];
    Ok(run_tool(&dir, "pack-project.js", &args))
}

/// Build a shareable mod. `bases` is one or more base game folders (variants).
#[tauri::command]
fn share_build(
    app: AppHandle,
    project: String,
    bases: Vec<String>,
    out: String,
    name: String,
    author: String,
    version: String,
    description: String,
) -> Result<ToolResult, String> {
    let dir = resource_dir(&app)?;
    let mut args = vec!["--project".into(), project, "--out".into(), out, "--force".into()];
    for b in bases {
        args.push("--base".into());
        args.push(b);
    }
    if !name.is_empty() {
        args.push("--name".into());
        args.push(name);
    }
    if !author.is_empty() {
        args.push("--author".into());
        args.push(author);
    }
    if !version.is_empty() {
        args.push("--version".into());
        args.push(version);
    }
    if !description.is_empty() {
        args.push("--description".into());
        args.push(description);
    }
    Ok(run_tool(&dir, "share-project.js", &args))
}

/// Start the `play.js` dev server (serves the project in true browser mode and
/// opens the browser). Runs in the background until stop_play / app exit.
#[tauri::command]
fn start_play(app: AppHandle, project: String, state: State<PlayState>) -> Result<(), String> {
    let dir = resource_dir(&app)?;
    let node = node_binary(&dir);
    let script = tool_path(&dir, "play.js");
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(child) = guard.as_mut() {
        let _ = child.kill();
    }
    let child = Command::new(&node)
        .arg(&script)
        .arg(&project)
        .current_dir(&dir)
        .spawn()
        .map_err(|e| format!("Failed to start play.js: {e}"))?;
    *guard = Some(child);
    Ok(())
}

#[tauri::command]
fn stop_play(state: State<PlayState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(mut child) = guard.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    Ok(())
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
        .manage(PlayState::default())
        .invoke_handler(tauri::generate_handler![
            extract_project,
            pack_project,
            share_build,
            start_play,
            stop_play,
            steam_detect,
            steam_catalog,
            steam_refresh,
            steam_archived,
            steam_remove_archived,
            steam_start,
            steam_finish
        ])
        .on_window_event(|window, event| {
            // Make sure the background dev server dies with the app.
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(state) = window.app_handle().try_state::<PlayState>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(mut child) = guard.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
