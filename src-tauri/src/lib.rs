use serde::Serialize;
use std::process::Command;
use tauri::{Emitter, Window};

#[derive(Serialize, Clone)]
struct NodeInfo {
    installed: bool,
    version: Option<String>,
    path: Option<String>,
    manager: Option<String>,
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

#[tauri::command]
fn detect_node() -> Result<NodeInfo, String> {
    let output = Command::new("node").arg("--version").output();

    let stdout = output
        .as_ref()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default();

    let ok = output.as_ref().map(|o| o.status.success()).unwrap_or(false);
    if !ok {
        return Ok(NodeInfo {
            installed: false,
            version: None,
            path: None,
            manager: None,
        });
    }

    let path = Command::new("which")
        .arg("node")
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|p| !p.is_empty());

    let manager = path.as_deref().and_then(detect_manager_from_path);

    Ok(NodeInfo {
        installed: true,
        version: Some(if stdout.is_empty() { "unknown".into() } else { stdout }),
        path,
        manager,
    })
}

fn detect_manager_from_path(path: &str) -> Option<String> {
    let p = path.to_lowercase();
    if p.contains(".volta") {
        return Some("volta".into());
    }
    if p.contains("/nvm/") {
        return Some("nvm".into());
    }
    if p.contains("/fnm/") {
        return Some("fnm".into());
    }
    if p.contains("/asdf/") {
        return Some("asdf".into());
    }
    if p.contains("/mise/") || p.contains("/rtx/") {
        return Some("mise".into());
    }
    if p.contains("/homebrew/") || p.contains("/opt/homebrew/") {
        return Some("homebrew".into());
    }
    Some("system".into())
}

#[tauri::command]
async fn install_node(window: Window) -> Result<(), String> {
    emit_progress(&window, "checking", "Checking environment", false);

    if detect_node()
        .map(|i| i.installed)
        .unwrap_or(false)
    {
        emit_progress(&window, "done", "Node.js already installed", true);
        return Ok(());
    }

    emit_progress(&window, "download", "Downloading Volta installer", false);

    let script = "curl -fsSL https://get.volta.sh | bash";
    let output = Command::new("bash")
        .arg("-c")
        .arg(script)
        .output()
        .map_err(|e| format!("Failed to spawn installer: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        emit_progress(&window, "error", "Failed to install Volta", true);
        return Err(if stderr.is_empty() {
            "Volta installer exited non-zero".into()
        } else {
            stderr
        });
    }

    let home = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    let volta_bin = home.join(".volta").join("bin").join("volta");

    if !volta_bin.exists() {
        emit_progress(&window, "error", "Volta binary not found", true);
        return Err("Volta installation succeeded but binary not found".into());
    }

    emit_progress(&window, "node", "Installing Node.js via Volta", false);

    let output = Command::new(&volta_bin)
        .arg("install")
        .arg("node")
        .output()
        .map_err(|e| format!("Failed to install Node: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        emit_progress(&window, "error", "Failed to install Node", true);
        return Err(if stderr.is_empty() {
            "Node install exited non-zero".into()
        } else {
            stderr
        });
    }

    emit_progress(&window, "done", "Node.js is ready", true);
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