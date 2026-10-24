use super::scope::Scope;
use crate::node::cached_node_bin;
use std::path::PathBuf;
use std::process::{Command, Output};

pub(crate) fn resolve_node_bin() -> PathBuf {
    cached_node_bin()
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

pub(crate) fn run_skills_command(args: &[&str], scope: &Scope) -> Result<Output, String> {
    let node = resolve_node_bin();
    let npx = resolve_npx_bin();
    let mut cmd = Command::new(&npx);
    cmd.arg("--yes").arg("skills").args(args);
    // No registry update checks, funding banners or audit on every run: a
    // short command can finish before npm's background check does.
    cmd.env("DISABLE_TELEMETRY", "1")
        .env("npm_config_yes", "true")
        .env("npm_config_update_notifier", "false")
        .env("npm_config_fund", "false")
        .env("npm_config_audit", "false")
        .env("npm_config_progress", "false")
        .env("NO_UPDATE_NOTIFIER", "1");

    if let Some(dir) = scope.cwd() {
        cmd.current_dir(dir);
    }

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
