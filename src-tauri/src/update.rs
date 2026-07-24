use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdateInfo {
    pub current_version: String,
    pub latest_version: Option<String>,
    pub update_available: bool,
    pub release_url: Option<String>,
    pub release_notes: Option<String>,
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

fn fetch_latest_release() -> Result<GitHubRelease, String> {
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
    resp.into_json::<GitHubRelease>()
        .map_err(|e| format!("Failed to parse release: {e}"))
}

#[tauri::command]
pub async fn check_app_update() -> Result<AppUpdateInfo, String> {
    tauri::async_runtime::spawn_blocking(check_app_update_impl)
        .await
        .map_err(|e| format!("app update check task failed: {e}"))?
}

fn check_app_update_impl() -> Result<AppUpdateInfo, String> {
    let current = env!("CARGO_PKG_VERSION").to_string();
    let release = fetch_latest_release()?;
    let latest_tag = release.tag_name.clone();
    let latest_version = latest_tag.trim_start_matches('v').to_string();
    let update_available = is_newer(&latest_tag, &current);

    Ok(AppUpdateInfo {
        current_version: current,
        latest_version: Some(latest_version),
        update_available,
        release_url: Some(release.html_url),
        release_notes: release.body,
    })
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
    pub fallback_url: Option<String>,
}

#[tauri::command]
pub async fn install_app_update(app: AppHandle) -> Result<InstallResult, String> {
    install_app_update_impl(&app).await
}

async fn install_app_update_impl(app: &AppHandle) -> Result<InstallResult, String> {
    let fallback = || Some("https://github.com/sthbryan/curie/releases/latest".to_string());

    let updater = match app.updater() {
        Ok(u) => u,
        Err(e) => {
            return Ok(InstallResult {
                success: false,
                message: format!("Updater init failed: {e}"),
                fallback_url: fallback(),
            });
        }
    };

    let update = match updater.check().await {
        Ok(Some(u)) => u,
        Ok(None) => {
            return Ok(InstallResult {
                success: false,
                message: "No update available".to_string(),
                fallback_url: fallback(),
            });
        }
        Err(e) => {
            return Ok(InstallResult {
                success: false,
                message: format!("Updater check failed: {e}"),
                fallback_url: fallback(),
            });
        }
    };

    let _body = update.body.clone();
    let _version = update.version.clone();

    if let Err(e) = update
        .download_and_install(
            |chunk_len, content_len| {
                let _ = (chunk_len, content_len);
            },
            || {},
        )
        .await
    {
        return Ok(InstallResult {
            success: false,
            message: format!("Install failed: {e}"),
            fallback_url: fallback(),
        });
    }

    Ok(InstallResult {
        success: true,
        message: "Update installed — restarting…".to_string(),
        fallback_url: None,
    })
}
