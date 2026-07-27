use serde::Serialize;
use std::path::PathBuf;
use std::process::Command;

#[derive(Serialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ManagerInfo {
    pub id: String,
    pub path: String,
}

pub struct Manager {
    pub id: &'static str,
    pub binary: &'static str,
    pub files: &'static [&'static str],
    pub install: &'static str,
}

pub const VOLTA_BOOTSTRAP: &str = "curl -fsSL https://get.volta.sh | bash";

pub const MANAGERS: &[Manager] = &[
    Manager {
        id: "volta",
        binary: "volta",
        files: &["~/.volta/bin/volta"],
        install: "volta install node",
    },
    Manager {
        id: "fnm",
        binary: "fnm",
        files: &[
            "~/.fnm/fnm",
            "~/.local/share/fnm/fnm",
            "/opt/homebrew/bin/fnm",
            "/usr/local/bin/fnm",
        ],
        install: "fnm install --lts && fnm default lts-latest",
    },
    Manager {
        id: "mise",
        binary: "mise",
        files: &[
            "~/.local/bin/mise",
            "/opt/homebrew/bin/mise",
            "/usr/local/bin/mise",
        ],
        install: "mise use --global node@lts",
    },
    Manager {
        id: "asdf",
        binary: "asdf",
        files: &[
            "~/.asdf/bin/asdf",
            "/opt/homebrew/bin/asdf",
            "/usr/local/bin/asdf",
        ],
        install: "asdf plugin add nodejs; asdf install nodejs latest; \
                  asdf set --home nodejs latest || asdf global nodejs latest",
    },
    Manager {
        id: "nvm",
        binary: "",
        files: &["~/.nvm/nvm.sh"],
        install: ". \"$HOME/.nvm/nvm.sh\" && nvm install --lts && nvm alias default 'lts/*'",
    },
    Manager {
        id: "homebrew",
        binary: "brew",
        files: &[
            "/opt/homebrew/bin/brew",
            "/usr/local/bin/brew",
            "/home/linuxbrew/.linuxbrew/bin/brew",
            "~/.linuxbrew/bin/brew",
        ],
        install: "brew install node",
    },
];

pub fn manager_by_id(id: &str) -> Option<&'static Manager> {
    MANAGERS.iter().find(|m| m.id == id)
}

pub fn detect_manager() -> Option<ManagerInfo> {
    let from_shell = shell_probe();
    for manager in MANAGERS {
        if let Some(path) = from_shell.iter().find(|(id, _)| id == manager.id) {
            return Some(ManagerInfo {
                id: manager.id.into(),
                path: path.1.clone(),
            });
        }
        if let Some(path) = manager.files.iter().find_map(|f| existing(f)) {
            return Some(ManagerInfo {
                id: manager.id.into(),
                path: path.to_string_lossy().to_string(),
            });
        }
    }
    None
}

fn existing(file: &str) -> Option<PathBuf> {
    let path = expand_home(file)?;
    path.exists().then_some(path)
}

pub fn expand_home(file: &str) -> Option<PathBuf> {
    match file.strip_prefix("~/") {
        Some(rest) => Some(dirs::home_dir()?.join(rest)),
        None => Some(PathBuf::from(file)),
    }
}

fn shell_probe() -> Vec<(String, String)> {
    let output = match Command::new("bash").args(["-lc", &probe_script()]).output() {
        Ok(output) => output,
        Err(_) => return Vec::new(),
    };
    parse_probe(&String::from_utf8_lossy(&output.stdout))
}

pub fn probe_script() -> String {
    let mut script = String::new();
    for manager in MANAGERS {
        if manager.binary.is_empty() {
            continue;
        }
        script.push_str(&format!(
            "p=$(command -v {} 2>/dev/null) && printf '{}\\t%s\\n' \"$p\"\n",
            manager.binary, manager.id
        ));
    }
    script.push_str("exit 0\n");
    script
}

pub fn parse_probe(stdout: &str) -> Vec<(String, String)> {
    stdout
        .lines()
        .filter_map(|line| line.split_once('\t'))
        .filter(|(id, path)| !id.trim().is_empty() && !path.trim().is_empty())
        .map(|(id, path)| (id.trim().to_string(), path.trim().to_string()))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_manager_has_an_install_command() {
        for manager in MANAGERS {
            assert!(!manager.install.is_empty(), "{} has no install", manager.id);
            assert!(
                !manager.files.is_empty(),
                "{} has no probe paths",
                manager.id
            );
        }
    }

    #[test]
    fn looks_up_managers_by_id() {
        assert_eq!(
            manager_by_id("volta").map(|m| m.install),
            Some("volta install node")
        );
        assert_eq!(
            manager_by_id("homebrew").map(|m| m.install),
            Some("brew install node")
        );
        assert!(manager_by_id("pnpm").is_none());
    }

    #[test]
    fn volta_is_preferred_over_the_rest() {
        assert_eq!(MANAGERS[0].id, "volta");
        assert_eq!(MANAGERS.last().map(|m| m.id), Some("homebrew"));
    }

    #[test]
    fn probe_script_skips_managers_without_a_binary() {
        let script = probe_script();
        assert!(script.contains("command -v volta"));
        assert!(script.contains("command -v brew"));
        assert!(!script.contains("command -v \n"));
        assert!(!script.contains("nvm\\t"));
    }

    #[test]
    fn parses_tab_separated_probe_output() {
        let out = "volta\t/Users/alice/.volta/bin/volta\nfnm\t/opt/homebrew/bin/fnm\n";
        assert_eq!(
            parse_probe(out),
            vec![
                (
                    "volta".to_string(),
                    "/Users/alice/.volta/bin/volta".to_string()
                ),
                ("fnm".to_string(), "/opt/homebrew/bin/fnm".to_string()),
            ]
        );
    }

    #[test]
    fn ignores_blank_and_malformed_probe_lines() {
        let out = "\nvolta\t\n\tpath\nmise\t/usr/local/bin/mise\nnoise\n";
        assert_eq!(
            parse_probe(out),
            vec![("mise".to_string(), "/usr/local/bin/mise".to_string())]
        );
    }

    #[test]
    fn expands_the_home_prefix_only() {
        let home = dirs::home_dir().unwrap();
        assert_eq!(
            expand_home("~/.volta/bin/volta"),
            Some(home.join(".volta/bin/volta"))
        );
        assert_eq!(
            expand_home("/opt/homebrew/bin/brew"),
            Some(PathBuf::from("/opt/homebrew/bin/brew"))
        );
    }
}
