use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Serialize, Clone, Debug, PartialEq)]
pub struct NodeInfo {
    pub installed: bool,
    pub version: Option<String>,
    pub path: Option<String>,
    pub manager: Option<String>,
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

pub fn find_node() -> Option<NodeInfo> {
    let home = dirs::home_dir().unwrap_or_default();

    let mut candidates = vec![
        home.join(".volta/bin/node"),
        home.join(".fnm/aliases/default/bin/node"),
        home.join(".local/share/fnm/aliases/default/bin/node"),
        home.join(".local/share/mise/shims/node"),
        home.join(".asdf/shims/node"),
    ];
    candidates.extend(nvm_node(&home));
    candidates.extend([
        PathBuf::from("/opt/homebrew/bin/node"),
        PathBuf::from("/usr/local/bin/node"),
        PathBuf::from("/usr/bin/node"),
        PathBuf::from("/bin/node"),
    ]);

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

fn nvm_node(home: &Path) -> Option<PathBuf> {
    let versions = home.join(".nvm").join("versions").join("node");
    let names: Vec<String> = std::fs::read_dir(&versions)
        .ok()?
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.file_name().to_string_lossy().to_string())
        .collect();
    Some(
        versions
            .join(newest_version(&names)?)
            .join("bin")
            .join("node"),
    )
}

pub fn newest_version(names: &[String]) -> Option<String> {
    names
        .iter()
        .filter_map(|name| parse_version(name).map(|parsed| (parsed, name)))
        .max_by_key(|(parsed, _)| *parsed)
        .map(|(_, name)| name.clone())
}

fn parse_version(name: &str) -> Option<(u32, u32, u32)> {
    let mut parts = name.strip_prefix('v').unwrap_or(name).split('.');
    let major = parts.next()?.parse().ok()?;
    let minor = parts.next()?.parse().ok()?;
    let patch = parts.next()?.parse().ok()?;
    Some((major, minor, patch))
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

pub fn detect_manager_from_path(path: &str) -> Option<String> {
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
            detect_manager_from_path(
                "/Users/alice/.local/share/mise/installs/node/22.0.0/bin/node"
            ),
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
        assert_eq!(detect_manager_from_path("/bin/node"), Some("system".into()));
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
    fn picks_the_newest_nvm_version_numerically() {
        let names = ["v9.11.2", "v22.3.0", "v10.24.1"]
            .map(String::from)
            .to_vec();
        assert_eq!(newest_version(&names), Some("v22.3.0".into()));
    }

    #[test]
    fn compares_minor_and_patch_before_falling_back() {
        let names = ["v20.1.9", "v20.2.0", "v20.2.1"].map(String::from).to_vec();
        assert_eq!(newest_version(&names), Some("v20.2.1".into()));
    }

    #[test]
    fn skips_entries_that_are_not_versions() {
        let names = ["lts", ".DS_Store", "v18.0.0"].map(String::from).to_vec();
        assert_eq!(newest_version(&names), Some("v18.0.0".into()));
        assert_eq!(newest_version(&["alias".to_string()]), None);
        assert_eq!(newest_version(&[]), None);
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
