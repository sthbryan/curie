use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{Emitter, Window};

#[derive(Serialize, Clone)]
pub struct NodeInfo {
    pub installed: bool,
    pub version: Option<String>,
    pub path: Option<String>,
    pub manager: Option<String>,
}

#[derive(Serialize, Clone)]
struct ProgressEvent {
    stage: String,
    message: String,
    done: bool,
}

#[tauri::command]
fn get_locale() -> String {
    sys_locale::get_locale().unwrap_or_else(|| "en-US".to_string())
}

pub fn detect_node_info() -> Result<NodeInfo, String> {
    if let Some(info) = find_node() {
        return Ok(info);
    }
    Ok(NodeInfo {
        installed: false,
        version: None,
        path: None,
        manager: None,
    })
}

fn find_node() -> Option<NodeInfo> {
    let home = dirs::home_dir().unwrap_or_default();

    let candidates = [
        home.join(".volta/bin/node"),
        home.join(".nvm/current/bin/node"),
        home.join(".fnm/current/bin/node"),
        PathBuf::from("/opt/homebrew/bin/node"),
        PathBuf::from("/usr/local/bin/node"),
        PathBuf::from("/usr/bin/node"),
        PathBuf::from("/bin/node"),
    ];

    for path in &candidates {
        if let Some(info) = probe_path(path) {
            return Some(info);
        }
    }

    for shell in ["zsh", "bash"] {
        if let Some(info) = probe_via_shell(shell) {
            return Some(info);
        }
    }

    if let Some(info) = probe_path(&PathBuf::from("node")) {
        return Some(info);
    }

    None
}

fn probe_path(path: &Path) -> Option<NodeInfo> {
    let output = Command::new(path).arg("--version").output().ok()?;
    if !output.status.success() {
        return None;
    }
    let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if version.is_empty() {
        return None;
    }
    let resolved = which_realpath(path).unwrap_or_else(|| path.to_path_buf());
    let path_str = resolved.to_string_lossy().to_string();
    let manager = detect_manager_from_path(&path_str);
    Some(NodeInfo {
        installed: true,
        version: Some(version),
        path: Some(path_str),
        manager,
    })
}

fn probe_via_shell(shell: &str) -> Option<NodeInfo> {
    let cmd = r#"
for f in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile"; do
  [ -f "$f" ] && . "$f" 2>/dev/null
done
p=$(command -v node 2>/dev/null) || exit 1
v=$(node --version 2>/dev/null) || exit 1
printf '%s\n%s' "$p" "$v"
"#;
    let output = Command::new(shell).args(["-l", "-c", cmd]).output().ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let mut lines = stdout.lines().filter(|l| !l.trim().is_empty());
    let path = lines.next()?.trim().to_string();
    let version = lines.next()?.trim().to_string();
    if path.is_empty() || version.is_empty() {
        return None;
    }
    let manager = detect_manager_from_path(&path);
    Some(NodeInfo {
        installed: true,
        version: Some(version),
        path: Some(path),
        manager,
    })
}

fn which_realpath(path: &Path) -> Option<PathBuf> {
    let output = Command::new("readlink").arg("-f").arg(path).output().ok()?;
    if output.status.success() {
        let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !s.is_empty() {
            return Some(PathBuf::from(s));
        }
    }
    None
}

fn detect_manager_from_path(path: &str) -> Option<String> {
    let p = path.to_lowercase();
    if p.contains(".volta") {
        return Some("volta".into());
    }
    if p.contains(".nvm/") {
        return Some("nvm".into());
    }
    if p.contains(".fnm/") {
        return Some("fnm".into());
    }
    if p.contains(".asdf/") {
        return Some("asdf".into());
    }
    if p.contains("/mise/") || p.contains("/rtx/") {
        return Some("mise".into());
    }
    if p.contains("/homebrew/") || p.contains("/cellar/") {
        return Some("homebrew".into());
    }
    Some("system".into())
}

#[tauri::command]
async fn install_node(window: Window) -> Result<(), String> {
    install_node_impl(|stage, message, done| {
        emit_progress(&window, stage, message, done);
    })
}

pub fn install_node_impl<F>(on_progress: F) -> Result<(), String>
where
    F: Fn(&str, &str, bool),
{
    on_progress("checking", "Checking environment", false);

    if detect_node_info()
        .map(|i| i.installed)
        .unwrap_or(false)
    {
        on_progress("done", "Node.js already installed", true);
        return Ok(());
    }

    on_progress("download", "Downloading Volta installer", false);

    let script = "curl -fsSL https://get.volta.sh | bash";
    let output = Command::new("bash")
        .arg("-c")
        .arg(script)
        .output()
        .map_err(|e| format!("Failed to spawn installer: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        on_progress("error", "Failed to install Volta", true);
        return Err(if stderr.is_empty() {
            "Volta installer exited non-zero".into()
        } else {
            stderr
        });
    }

    let home = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    let volta_bin = home.join(".volta").join("bin").join("volta");

    if !volta_bin.exists() {
        on_progress("error", "Volta binary not found", true);
        return Err("Volta installation succeeded but binary not found".into());
    }

    on_progress("node", "Installing Node.js via Volta", false);

    let output = Command::new(&volta_bin)
        .arg("install")
        .arg("node")
        .output()
        .map_err(|e| format!("Failed to install Node: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        on_progress("error", "Failed to install Node", true);
        return Err(if stderr.is_empty() {
            "Node install exited non-zero".into()
        } else {
            stderr
        });
    }

    on_progress("done", "Node.js is ready", true);
    Ok(())
}

fn emit_progress(window: &Window, stage: &str, message: &str, done: bool) {
    let _ = window.emit(
        "setup-progress",
        ProgressEvent {
            stage: stage.into(),
            message: message.into(),
            done,
        },
    );
}

#[tauri::command]
fn detect_node() -> Result<NodeInfo, String> {
    detect_node_info()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_locale,
            detect_node,
            install_node
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_volta() {
        assert_eq!(
            detect_manager_from_path("/Users/alice/.volta/bin/node"),
            Some("volta".into())
        );
        assert_eq!(
            detect_manager_from_path("/home/alice/.volta/bin/node"),
            Some("volta".into())
        );
    }

    #[test]
    fn detects_nvm() {
        assert_eq!(
            detect_manager_from_path("/Users/alice/.nvm/versions/node/v22.0.0/bin/node"),
            Some("nvm".into())
        );
    }

    #[test]
    fn detects_fnm() {
        assert_eq!(
            detect_manager_from_path("/Users/alice/.fnm/node-versions/v22.0.0/bin/node"),
            Some("fnm".into())
        );
    }

    #[test]
    fn detects_asdf() {
        assert_eq!(
            detect_manager_from_path("/Users/alice/.asdf/installs/nodejs/22.0.0/bin/node"),
            Some("asdf".into())
        );
    }

    #[test]
    fn detects_mise_via_rtx_legacy_path() {
        assert_eq!(
            detect_manager_from_path("/Users/alice/.local/share/mise/installs/node/22.0.0/bin/node"),
            Some("mise".into())
        );
        assert_eq!(
            detect_manager_from_path("/Users/alice/.local/share/rtx/installs/node/22.0.0/bin/node"),
            Some("mise".into())
        );
    }

    #[test]
    fn detects_homebrew_on_intel_and_silicon() {
        assert_eq!(
            detect_manager_from_path("/usr/local/Cellar/node/22.0.0/bin/node"),
            Some("homebrew".into())
        );
        assert_eq!(
            detect_manager_from_path("/opt/homebrew/Cellar/node/22.0.0/bin/node"),
            Some("homebrew".into())
        );
    }

    #[test]
    fn falls_back_to_system_for_unknown_paths() {
        assert_eq!(
            detect_manager_from_path("/usr/bin/node"),
            Some("system".into())
        );
        assert_eq!(
            detect_manager_from_path("/bin/node"),
            Some("system".into())
        );
    }

    #[test]
    fn is_case_insensitive() {
        assert_eq!(
            detect_manager_from_path("/Users/alice/.Volta/bin/node"),
            Some("volta".into())
        );
        assert_eq!(
            detect_manager_from_path("/USR/LOCAL/CELLAR/NODE/22.0.0/BIN/NODE"),
            Some("homebrew".into())
        );
    }

    #[test]
    fn first_match_wins_when_multiple_candidates() {
        let path = "/Users/alice/.volta/tools/image/node/22.0.0/bin/node";
        assert_eq!(detect_manager_from_path(path), Some("volta".into()));
    }

    #[test]
    fn detects_volta_shim_path() {
        assert_eq!(
            detect_manager_from_path("/Users/alice/.volta/bin/volta-shim"),
            Some("volta".into())
        );
        assert_eq!(
            detect_manager_from_path("/Users/alice/.volta/bin/node"),
            Some("volta".into())
        );
    }

    #[test]
    fn find_node_works_without_path_set() {
        let info = find_node();
        if let Some(info) = info {
            assert!(info.installed);
            assert!(info.version.is_some());
            assert!(info.path.is_some());
        }
    }
}