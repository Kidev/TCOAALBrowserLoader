// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Shared node-runner for the creator and user desktop apps. Each app resolves
// its Tauri resource directory (where the bundled Node runtime + the repo's
// tools/ are shipped) and calls run_tool() to execute one of the existing
// command-line tools. No tool logic is reimplemented here: the apps are thin
// GUIs over the same scripts the CLI uses.

use std::path::{Path, PathBuf};
use std::process::Command;

use serde::Serialize;

/// Result of running a bundled tool. Returned to the webview as JSON.
#[derive(Serialize, Clone)]
pub struct ToolResult {
    pub success: bool,
    pub code: i32,
    pub stdout: String,
    pub stderr: String,
}

/// Dev override: if TCOAAL_RES_DIR is set, use it as the resource dir instead
/// of the app's bundled one. Lets `tauri dev` point straight at the repo
/// (which already has tools/ + app/js/libs/) without building an installer.
pub fn resolve_resource_dir(app_resource_dir: PathBuf) -> PathBuf {
    match std::env::var_os("TCOAAL_RES_DIR") {
        Some(p) if !p.is_empty() => PathBuf::from(p),
        _ => app_resource_dir,
    }
}

/// Path to the Node binary used to run the tools. Honors a TCOAAL_NODE env
/// override (dev: point at your own `node`); otherwise the bundled
/// `runtime/node` (`runtime/node.exe` on Windows).
pub fn node_binary(resource_dir: &Path) -> PathBuf {
    if let Some(p) = std::env::var_os("TCOAAL_NODE") {
        if !p.is_empty() {
            return PathBuf::from(p);
        }
    }
    let name = if cfg!(windows) { "node.exe" } else { "node" };
    resource_dir.join("runtime").join(name)
}

/// Absolute path to a bundled tool script, e.g. tool_path(dir, "share-project.js").
pub fn tool_path(resource_dir: &Path, script: &str) -> PathBuf {
    resource_dir.join("tools").join(script)
}

/// Run `node tools/<script> <args...>` from the bundled runtime, capturing
/// output. The working directory is the resource dir so the tools resolve
/// their sibling data files (tools/map-*.json) and app/js/libs the same way
/// they do in the repo.
pub fn run_tool(resource_dir: &Path, script: &str, args: &[String]) -> ToolResult {
    let node = node_binary(resource_dir);
    let script_path = tool_path(resource_dir, script);

    if !node.exists() {
        return ToolResult {
            success: false,
            code: -1,
            stdout: String::new(),
            stderr: format!(
                "Bundled Node runtime not found at {}. This build is missing its runtime.",
                node.display()
            ),
        };
    }
    if !script_path.exists() {
        return ToolResult {
            success: false,
            code: -1,
            stdout: String::new(),
            stderr: format!("Bundled tool not found: {}", script_path.display()),
        };
    }

    let mut cmd = Command::new(&node);
    cmd.arg(&script_path);
    cmd.args(args);
    cmd.current_dir(resource_dir);

    match cmd.output() {
        Ok(out) => ToolResult {
            success: out.status.success(),
            code: out.status.code().unwrap_or(-1),
            stdout: String::from_utf8_lossy(&out.stdout).into_owned(),
            stderr: String::from_utf8_lossy(&out.stderr).into_owned(),
        },
        Err(e) => ToolResult {
            success: false,
            code: -1,
            stdout: String::new(),
            stderr: format!("Failed to launch Node: {e}"),
        },
    }
}
