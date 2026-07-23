use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdateInfo {
    pub current_version: String,
    pub latest_version: Option<String>,
    pub update_available: bool,
    pub release_url: Option<String>,
    pub release_notes: Option<String>,
    pub install_method: InstallMethod,
    pub update_command: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum InstallMethod {
    Homebrew,
    Direct,
    Unknown,
}

#[derive(Debug, serde::Deserialize)]
struct GitHubRelease {
    tag_name: String,
    html_url: String,
    body: Option<String>,
}

fn github_token() -> Option<String> {
    std::env::var("GITHUB_TOKEN")
        .or_else(|_| std::env::var("GH_TOKEN"))
        .ok()
        .filter(|t| !t.trim().is_empty())
}

fn parse_version(v: &str) -> Vec<u32> {
    v.trim_start_matches('v')
        .split('.')
        .filter_map(|s| s.parse::<u32>().ok())
        .collect()
}

fn is_newer(latest: &str, current: &str) -> bool {
    let latest_parts = parse_version(latest);
    let current_parts = parse_version(current);
    for (l, c) in latest_parts.iter().zip(current_parts.iter()) {
        if l > c {
            return true;
        } else if l < c {
            return false;
        }
    }
    latest_parts.len() > current_parts.len()
}

fn detect_install_method() -> (InstallMethod, Option<String>) {
    if let Ok(exe) = std::env::current_exe() {
        let path = exe.to_string_lossy().to_lowercase();
        if path.contains("homebrew") || path.contains("/cellar/") || path.contains("brew")
        {
            return (
                InstallMethod::Homebrew,
                Some("brew upgrade --cask curie".to_string()),
            );
        }
    }

    let brew_check = Command::new("which").arg("brew").output();
    if let Ok(output) = brew_check {
        if output.status.success() {
            let cask_check = Command::new("brew")
                .args(["list", "--cask", "sthbryan/tap/curie"])
                .output();
            if let Ok(cask_output) = cask_check {
                if cask_output.status.success() {
                    return (
                        InstallMethod::Homebrew,
                        Some("brew upgrade --cask curie".to_string()),
                    );
                }
            }
            let cask_check_short = Command::new("brew")
                .args(["list", "--cask", "curie"])
                .output();
            if let Ok(cask_output) = cask_check_short {
                if cask_output.status.success() {
                    return (
                        InstallMethod::Homebrew,
                        Some("brew upgrade --cask curie".to_string()),
                    );
                }
            }
        }
    }

    (InstallMethod::Direct, None)
}

#[tauri::command]
pub async fn check_app_update() -> Result<AppUpdateInfo, String> {
    tauri::async_runtime::spawn_blocking(check_app_update_impl)
        .await
        .map_err(|e| format!("app update check task failed: {e}"))?
}

fn check_app_update_impl() -> Result<AppUpdateInfo, String> {
    let current = env!("CARGO_PKG_VERSION").to_string();

    let (install_method, update_command) = detect_install_method();

    let agent = ureq::AgentBuilder::new()
        .timeout(std::time::Duration::from_secs(10))
        .build();

    let url = "https://api.github.com/repos/sthbryan/curie/releases/latest";

    let token = github_token();

    let mut req = agent
        .get(url)
        .set("Accept", "application/vnd.github.v3+json")
        .set("User-Agent", "curie-app");

    if let Some(ref t) = token {
        req = req.set("Authorization", &format!("Bearer {t}"));
    }

    let resp = req
        .call()
        .map_err(|e| format!("Failed to fetch latest release: {e}"))?;
    let release: GitHubRelease = resp
        .into_json()
        .map_err(|e| format!("Failed to parse release: {e}"))?;

    let latest_tag = release.tag_name.clone();
    let latest_version = latest_tag.trim_start_matches('v').to_string();
    let update_available = is_newer(&latest_tag, &current);

    Ok(AppUpdateInfo {
        current_version: current,
        latest_version: Some(latest_version),
        update_available,
        release_url: Some(release.html_url),
        release_notes: release.body,
        install_method,
        update_command,
    })
}
