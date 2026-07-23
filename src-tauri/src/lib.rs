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

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillInfo {
    pub name: String,
    pub path: String,
    pub scope: String,
    pub agents: Vec<String>,
    pub source: Option<String>,
    pub source_url: Option<String>,
    pub source_type: Option<String>,
    pub installed_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillUpdateInfo {
    pub name: String,
    pub source: Option<String>,
    pub update_available: bool,
    pub checkable: bool,
}

#[derive(serde::Deserialize)]
struct CliSkill {
    name: String,
    path: String,
    scope: String,
    #[serde(default)]
    agents: Vec<String>,
    source: Option<String>,
    #[serde(rename = "sourceUrl")]
    source_url: Option<String>,
    #[serde(rename = "sourceType")]
    source_type: Option<String>,
}

#[derive(serde::Deserialize, Default)]
struct SkillLockFile {
    #[serde(default)]
    skills: std::collections::HashMap<String, SkillLockEntry>,
}

#[derive(serde::Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
struct SkillLockEntry {
    source: Option<String>,
    source_type: Option<String>,
    source_url: Option<String>,
    skill_path: Option<String>,
    skill_folder_hash: Option<String>,
    installed_at: Option<String>,
    updated_at: Option<String>,
    #[serde(default)]
    r#ref: Option<String>,
}

#[derive(serde::Deserialize)]
struct GitTreeResponse {
    sha: String,
    #[serde(default)]
    tree: Vec<GitTreeEntry>,
}

#[derive(serde::Deserialize)]
struct GitTreeEntry {
    path: String,
    #[serde(rename = "type")]
    entry_type: String,
    sha: String,
}

fn resolve_node_bin() -> PathBuf {
    detect_node_info()
        .ok()
        .and_then(|info| info.path.map(PathBuf::from))
        .unwrap_or_else(|| PathBuf::from("node"))
}

fn resolve_npx_bin() -> PathBuf {
    let node = resolve_node_bin();
    if let Some(parent) = node.parent() {
        let candidate = parent.join("npx");
        if candidate.exists() {
            return candidate;
        }
    }
    PathBuf::from("npx")
}

fn run_skills_list_global() -> Result<Vec<CliSkill>, String> {
    let node = resolve_node_bin();
    let npx = resolve_npx_bin();
    let mut cmd = Command::new(&npx);
    cmd.args(["--yes", "skills", "list", "-g", "--json"])
        .env("DISABLE_TELEMETRY", "1")
        .env("npm_config_yes", "true");

    if let Some(parent) = node.parent() {
        let path = std::env::var_os("PATH").unwrap_or_default();
        let mut paths = std::env::split_paths(&path).collect::<Vec<_>>();
        paths.insert(0, parent.to_path_buf());
        if let Ok(joined) = std::env::join_paths(paths) {
            cmd.env("PATH", joined);
        }
    }

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to run skills list: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        return Err(if !stderr.is_empty() {
            stderr
        } else if !stdout.is_empty() {
            stdout
        } else {
            "skills list exited non-zero".into()
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let json = extract_json_array(&stdout)
        .ok_or_else(|| "skills list did not return JSON".to_string())?;

    serde_json::from_str(json).map_err(|e| format!("Failed to parse skills list JSON: {e}"))
}

fn extract_json_array(raw: &str) -> Option<&str> {
    let start = raw.find('[')?;
    let end = raw.rfind(']')?;
    if end < start {
        return None;
    }
    Some(&raw[start..=end])
}

fn load_skill_lock() -> SkillLockFile {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return SkillLockFile::default(),
    };

    let candidates = [
        home.join(".agents").join(".skill-lock.json"),
        home.join(".skill-lock.json"),
        home.join("skills-lock.json"),
    ];

    for path in candidates {
        if let Ok(raw) = std::fs::read_to_string(&path) {
            if let Ok(lock) = serde_json::from_str::<SkillLockFile>(&raw) {
                return lock;
            }
        }
    }

    SkillLockFile::default()
}

pub fn list_global_skills() -> Result<Vec<SkillInfo>, String> {
    let cli_skills = run_skills_list_global()?;
    let lock = load_skill_lock();

    Ok(cli_skills
        .into_iter()
        .map(|s| {
            let meta = lock.skills.get(&s.name);
            SkillInfo {
                name: s.name,
                path: s.path,
                scope: s.scope,
                agents: s.agents,
                source: s.source,
                source_url: s.source_url,
                source_type: s.source_type,
                installed_at: meta.and_then(|m| m.installed_at.clone()),
                updated_at: meta.and_then(|m| m.updated_at.clone()),
            }
        })
        .collect())
}

/// Strip `SKILL.md` from a lock skillPath to get the skill folder path in the repo tree.
fn skill_folder_path(skill_path: &str) -> String {
    let mut path = skill_path.replace('\\', "/");
    let lower = path.to_ascii_lowercase();
    if lower.ends_with("/skill.md") {
        path.truncate(path.len().saturating_sub(9));
    } else if lower.ends_with("skill.md") {
        path.truncate(path.len().saturating_sub(8));
    }
    while path.ends_with('/') {
        path.pop();
    }
    path
}

fn github_token() -> Option<String> {
    std::env::var("GITHUB_TOKEN")
        .or_else(|_| std::env::var("GH_TOKEN"))
        .ok()
        .filter(|t| !t.trim().is_empty())
}

fn encode_path_segment(segment: &str) -> String {
    let mut out = String::with_capacity(segment.len());
    for b in segment.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char);
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

fn fetch_github_tree(owner_repo: &str, r#ref: Option<&str>) -> Option<GitTreeResponse> {
    let branches: Vec<&str> = if let Some(r) = r#ref.filter(|s| !s.is_empty()) {
        vec![r]
    } else {
        vec!["HEAD", "main", "master"]
    };

    let token = github_token();
    let agent = ureq::AgentBuilder::new()
        .timeout(std::time::Duration::from_secs(10))
        .build();

    for branch in branches {
        let url = format!(
            "https://api.github.com/repos/{}/git/trees/{}?recursive=1",
            owner_repo,
            encode_path_segment(branch)
        );

        let mut req = agent
            .get(&url)
            .set("Accept", "application/vnd.github.v3+json")
            .set("User-Agent", "curie-skills-manager");

        if let Some(ref t) = token {
            req = req.set("Authorization", &format!("Bearer {t}"));
        }

        match req.call() {
            Ok(resp) => {
                if let Ok(tree) = resp.into_json::<GitTreeResponse>() {
                    return Some(tree);
                }
            }
            Err(ureq::Error::Status(403, resp)) => {
                let remaining = resp.header("x-ratelimit-remaining").unwrap_or("?");
                if remaining == "0" {
                    break;
                }
            }
            Err(_) => continue,
        }
    }

    None
}

fn latest_folder_hash(tree: &GitTreeResponse, skill_path: &str) -> Option<String> {
    let folder = skill_folder_path(skill_path);
    if folder.is_empty() {
        return Some(tree.sha.clone());
    }
    tree.tree
        .iter()
        .find(|e| e.entry_type == "tree" && e.path == folder)
        .map(|e| e.sha.clone())
}

fn is_github_entry(entry: &SkillLockEntry) -> bool {
    entry
        .source_type
        .as_deref()
        .map(|t| t.eq_ignore_ascii_case("github"))
        .unwrap_or(false)
        || entry
            .source
            .as_deref()
            .map(|s| s.contains('/') && !s.contains("://"))
            .unwrap_or(false)
}

pub fn check_global_skill_updates() -> Result<Vec<SkillUpdateInfo>, String> {
    let lock = load_skill_lock();
    if lock.skills.is_empty() {
        return Ok(Vec::new());
    }

    // Group checkable GitHub skills by source (one tree fetch per repo).
    let mut by_source: std::collections::HashMap<String, Vec<(String, SkillLockEntry)>> =
        std::collections::HashMap::new();
    let mut results: Vec<SkillUpdateInfo> = Vec::new();

    for (name, entry) in &lock.skills {
        let has_hash = entry
            .skill_folder_hash
            .as_ref()
            .map(|h| !h.is_empty())
            .unwrap_or(false);
        let has_path = entry
            .skill_path
            .as_ref()
            .map(|p| !p.is_empty())
            .unwrap_or(false);

        if !has_hash || !has_path || !is_github_entry(entry) {
            results.push(SkillUpdateInfo {
                name: name.clone(),
                source: entry.source.clone(),
                update_available: false,
                checkable: false,
            });
            continue;
        }

        let source = entry
            .source
            .clone()
            .or_else(|| {
                entry.source_url.as_ref().and_then(|url| {
                    // https://github.com/owner/repo.git → owner/repo
                    url.trim_end_matches(".git")
                        .trim_end_matches('/')
                        .rsplit_once("github.com/")
                        .map(|(_, rest)| rest.to_string())
                })
            })
            .unwrap_or_default();

        if source.is_empty() {
            results.push(SkillUpdateInfo {
                name: name.clone(),
                source: entry.source.clone(),
                update_available: false,
                checkable: false,
            });
            continue;
        }

        by_source
            .entry(source)
            .or_default()
            .push((name.clone(), entry.clone()));
    }

    for (source, items) in by_source {
        let ref_hint = items
            .first()
            .and_then(|(_, e)| e.r#ref.as_deref())
            .map(|s| s.to_string());
        let tree = fetch_github_tree(&source, ref_hint.as_deref());

        for (name, entry) in items {
            let Some(tree) = tree.as_ref() else {
                results.push(SkillUpdateInfo {
                    name,
                    source: Some(source.clone()),
                    update_available: false,
                    checkable: true,
                });
                continue;
            };

            let skill_path = entry.skill_path.as_deref().unwrap_or("");
            let local_hash = entry.skill_folder_hash.as_deref().unwrap_or("");
            let latest = latest_folder_hash(tree, skill_path);
            let update_available = latest
                .as_deref()
                .map(|h| h != local_hash)
                .unwrap_or(false);

            results.push(SkillUpdateInfo {
                name,
                source: Some(source.clone()),
                update_available,
                checkable: true,
            });
        }
    }

    results.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(results)
}

#[tauri::command]
fn list_skills() -> Result<Vec<SkillInfo>, String> {
    list_global_skills()
}

#[tauri::command]
async fn check_skill_updates() -> Result<Vec<SkillUpdateInfo>, String> {
    tauri::async_runtime::spawn_blocking(check_global_skill_updates)
        .await
        .map_err(|e| format!("update check task failed: {e}"))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_locale,
            detect_node,
            install_node,
            list_skills,
            check_skill_updates
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

    #[test]
    fn extract_json_array_strips_noise() {
        let raw = "Global Skills\n[{ \"name\": \"a\", \"path\": \"/x\", \"scope\": \"global\" }]\n";
        let json = extract_json_array(raw).expect("json");
        assert!(json.starts_with('['));
        assert!(json.ends_with(']'));
    }

    #[test]
    fn skill_folder_path_strips_skill_md() {
        assert_eq!(
            skill_folder_path("skills/taste-skill/SKILL.md"),
            "skills/taste-skill"
        );
        assert_eq!(
            skill_folder_path(".agents/skills/impeccable/SKILL.md"),
            ".agents/skills/impeccable"
        );
        assert_eq!(skill_folder_path("nothing-design/skill.md"), "nothing-design");
        assert_eq!(skill_folder_path("SKILL.md"), "");
    }

    #[test]
    fn latest_folder_hash_matches_tree_entry() {
        let tree = GitTreeResponse {
            sha: "root".into(),
            tree: vec![
                GitTreeEntry {
                    path: "skills/taste-skill".into(),
                    entry_type: "tree".into(),
                    sha: "abc123".into(),
                },
                GitTreeEntry {
                    path: "skills/taste-skill/SKILL.md".into(),
                    entry_type: "blob".into(),
                    sha: "blob".into(),
                },
            ],
        };
        assert_eq!(
            latest_folder_hash(&tree, "skills/taste-skill/SKILL.md").as_deref(),
            Some("abc123")
        );
        assert_eq!(latest_folder_hash(&tree, "missing/SKILL.md"), None);
        assert_eq!(latest_folder_hash(&tree, "SKILL.md").as_deref(), Some("root"));
    }
}