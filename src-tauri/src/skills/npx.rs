use crate::node::detect_node_info;
use std::path::PathBuf;
use std::process::{Command, Output};

pub(crate) fn resolve_node_bin() -> PathBuf {
    detect_node_info()
        .ok()
        .and_then(|info| info.path.map(PathBuf::from))
        .unwrap_or_else(|| PathBuf::from("node"))
}

pub(crate) fn resolve_npx_bin() -> PathBuf {
    let node = resolve_node_bin();
    if let Some(parent) = node.parent() {
        let candidate = parent.join("npx");
        if candidate.exists() {
            return candidate;
        }
    }
    PathBuf::from("npx")
}

pub(crate) fn run_skills_command(args: &[&str]) -> Result<Output, String> {
    let node = resolve_node_bin();
    let npx = resolve_npx_bin();
    let mut cmd = Command::new(&npx);
    cmd.arg("--yes").arg("skills").args(args);
    cmd.env("DISABLE_TELEMETRY", "1")
        .env("npm_config_yes", "true");

    if let Some(parent) = node.parent() {
        let path = std::env::var_os("PATH").unwrap_or_default();
        let mut paths = std::env::split_paths(&path).collect::<Vec<_>>();
        paths.insert(0, parent.to_path_buf());
        if let Ok(joined) = std::env::join_paths(paths) {
            cmd.env("PATH", joined);
        }
    }

    cmd.output().map_err(|e| {
        format!(
            "Failed to run skills {}: {e}",
            args.first().unwrap_or(&"command")
        )
    })
}

pub(crate) fn extract_json_array(raw: &str) -> Option<&str> {
    let start = raw.find('[')?;
    let end = raw.rfind(']')?;
    if end < start {
        return None;
    }
    Some(&raw[start..=end])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extract_json_array_strips_noise() {
        let raw = "Global Skills\n[{ \"name\": \"a\", \"path\": \"/x\", \"scope\": \"global\" }]\n";
        let json = extract_json_array(raw).expect("json");
        assert!(json.starts_with('['));
        assert!(json.ends_with(']'));
    }
}
