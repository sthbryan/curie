use super::detect::detect_node_info;
use std::process::Command;

pub fn install_node_impl<F>(on_progress: F) -> Result<(), String>
where
    F: Fn(&str, &str, bool),
{
    on_progress("checking", "Checking environment", false);

    if detect_node_info().map(|i| i.installed).unwrap_or(false) {
        on_progress("done", "Node.js already installed", true);
        return Ok(());
    }

    on_progress("download", "Downloading Volta installer", false);

    let script = "curl -fsSL https://get.volta.sh | bash";
    let output = Command::new("bash")
        .arg("-c")
        .arg(script)
        .output()
        .map_err(|e| format!("Failed to spawn installer: {e}"))?;

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
        .map_err(|e| format!("Failed to install Node: {e}"))?;

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
