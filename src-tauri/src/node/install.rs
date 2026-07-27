use super::detect::detect_node_info;
use super::manager::{detect_manager, manager_by_id, ManagerInfo, VOLTA_BOOTSTRAP};
use super::volta::install_volta;
use super::NodeInfo;
use serde::Serialize;
use std::process::Command;

#[derive(Serialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SetupPlan {
    pub node: NodeInfo,
    pub manager: Option<ManagerInfo>,
    pub steps: Vec<String>,
    pub command: String,
}

pub fn build_plan() -> Result<SetupPlan, String> {
    let node = detect_node_info()?;
    if node.installed {
        return Ok(SetupPlan {
            node,
            manager: None,
            steps: vec!["done".into()],
            command: String::new(),
        });
    }

    let manager = detect_manager();
    let (steps, command) = match &manager {
        Some(found) => (
            vec!["check", "node", "verify"],
            manager_by_id(&found.id)
                .map(|m| m.install)
                .unwrap_or_default()
                .to_string(),
        ),
        None => (
            vec!["check", "volta", "node", "verify"],
            format!("{VOLTA_BOOTSTRAP}\nvolta install node"),
        ),
    };

    Ok(SetupPlan {
        node,
        manager,
        steps: steps.into_iter().map(String::from).collect(),
        command,
    })
}

pub fn install_node_impl<F>(on_progress: F) -> Result<NodeInfo, String>
where
    F: Fn(&str, &str, bool),
{
    match run_setup(&on_progress) {
        Ok(node) => {
            on_progress("done", "Node.js is ready", true);
            Ok(node)
        }
        Err(message) => {
            on_progress("error", &message, true);
            Err(message)
        }
    }
}

fn run_setup<F>(on_progress: &F) -> Result<NodeInfo, String>
where
    F: Fn(&str, &str, bool),
{
    on_progress("check", "Checking your environment", false);

    let node = detect_node_info()?;
    if node.installed {
        return Ok(node);
    }

    let id = match detect_manager() {
        Some(found) => found.id,
        None => {
            on_progress("volta", "Installing Volta", false);
            install_volta()?;
            "volta".to_string()
        }
    };

    let manager = manager_by_id(&id).ok_or_else(|| format!("unsupported version manager: {id}"))?;
    on_progress("node", &format!("Installing Node.js with {id}"), false);
    run(manager.install)?;

    on_progress("verify", "Verifying the install", false);
    let node = detect_node_info()?;
    if !node.installed {
        return Err(format!(
            "{id} finished but Node.js is still not on this machine. Open a new terminal and run `{}`.",
            manager.install
        ));
    }
    Ok(node)
}

fn run(script: &str) -> Result<(), String> {
    let output = Command::new("bash")
        .args(["-lc", script])
        .output()
        .map_err(|e| format!("could not start the installer: {e}"))?;

    if output.status.success() {
        return Ok(());
    }
    Err(tail(&String::from_utf8_lossy(&output.stderr))
        .unwrap_or_else(|| format!("`{script}` exited with a non-zero status")))
}

pub fn tail(stderr: &str) -> Option<String> {
    let lines: Vec<&str> = stderr
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect();
    if lines.is_empty() {
        return None;
    }
    Some(lines[lines.len().saturating_sub(4)..].join("\n"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_only_the_last_lines_of_stderr() {
        let stderr = "one\ntwo\nthree\nfour\nfive\nsix";
        assert_eq!(tail(stderr), Some("three\nfour\nfive\nsix".into()));
    }

    #[test]
    fn drops_blank_lines_and_reports_nothing_for_empty_output() {
        assert_eq!(tail("\n  \nboom\n\n"), Some("boom".into()));
        assert_eq!(tail("   \n\n"), None);
        assert_eq!(tail(""), None);
    }

    #[test]
    fn a_plan_without_a_manager_bootstraps_volta() {
        let plan = SetupPlan {
            node: NodeInfo {
                installed: false,
                version: None,
                path: None,
                manager: None,
            },
            manager: None,
            steps: vec![
                "check".into(),
                "volta".into(),
                "node".into(),
                "verify".into(),
            ],
            command: format!("{VOLTA_BOOTSTRAP}\nvolta install node"),
        };
        assert!(plan.steps.contains(&"volta".to_string()));
        assert!(plan.command.contains("get.volta.sh"));
    }

    #[test]
    fn build_plan_matches_what_is_on_this_machine() {
        let plan = build_plan().expect("plan");
        if plan.node.installed {
            assert_eq!(plan.steps, vec!["done".to_string()]);
            assert!(plan.command.is_empty());
        } else {
            assert_eq!(plan.steps.first(), Some(&"check".to_string()));
            assert_eq!(plan.steps.last(), Some(&"verify".to_string()));
            assert!(!plan.command.is_empty());
            assert_eq!(
                plan.steps.contains(&"volta".to_string()),
                plan.manager.is_none()
            );
        }
    }
}
