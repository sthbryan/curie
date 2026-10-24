use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};

use yaml_rust2::{Yaml, YamlLoader};

use super::lock::load_skill_lock;
use super::scope::Scope;
use super::types::{SkillInfo, SkillLockEntry, SkillLockFile};

const SKILL_FILE: &str = "SKILL.md";
const SKIP_DIRS: &[&str] = &[
    ".git",
    ".cache",
    ".cargo",
    ".npm",
    ".rustup",
    ".Trash",
    "node_modules",
    "target",
    "dist",
    "build",
    "__pycache__",
];

struct SkillRoot {
    path: PathBuf,
    agent: Option<String>,
    canonical: bool,
}

struct FoundSkill {
    name: String,
    path: PathBuf,
    agents: Vec<String>,
    canonical: bool,
}

pub(crate) fn scan_skills(scope: &Scope) -> Vec<SkillInfo> {
    let base = match scope {
        Scope::Global => match dirs::home_dir() {
            Some(home) => home,
            None => return Vec::new(),
        },
        Scope::Project(path) => path.clone(),
    };
    let lock = load_skill_lock(scope);
    scan_at(scope, &base, &lock)
}

fn scan_at(scope: &Scope, base: &Path, lock: &SkillLockFile) -> Vec<SkillInfo> {
    let scope_label = match scope {
        Scope::Global => "global",
        Scope::Project(_) => "project",
    };
    let mut found: Vec<FoundSkill> = Vec::new();
    let mut indexes: HashMap<String, usize> = HashMap::new();
    let mut parsed: HashMap<PathBuf, Option<(String, String)>> = HashMap::new();

    for root in skill_roots(scope, base) {
        let Ok(entries) = std::fs::read_dir(&root.path) else {
            continue;
        };
        for entry in entries.flatten() {
            let skill_dir = entry.path();
            if !skill_dir.is_dir() {
                continue;
            }
            let skill_md = skill_dir.join(SKILL_FILE);
            if !skill_md.is_file() {
                continue;
            }

            // Agent directories are usually symlinks into the canonical
            // .agents/skills tree. Read each target once.
            let identity = std::fs::canonicalize(&skill_dir).unwrap_or_else(|_| skill_dir.clone());
            let metadata = parsed
                .entry(identity)
                .or_insert_with(|| parse_skill_md(&skill_md));
            let Some((name, _description)) = metadata.as_ref() else {
                continue;
            };
            if name.is_empty() {
                continue;
            }

            if let Some(index) = indexes.get(name) {
                let skill = &mut found[*index];
                if root.canonical {
                    skill.path = skill_dir;
                    skill.canonical = true;
                }
                if let Some(agent) = &root.agent {
                    if !skill.agents.contains(agent) {
                        skill.agents.push(agent.clone());
                    }
                }
            } else {
                indexes.insert(name.clone(), found.len());
                found.push(FoundSkill {
                    name: name.clone(),
                    path: skill_dir,
                    agents: root.agent.iter().cloned().collect(),
                    canonical: root.canonical,
                });
            }
        }
    }

    found.sort_by(|a, b| a.name.cmp(&b.name));

    found
        .into_iter()
        .map(|skill| {
            let meta = lock_entry(lock, &skill.name);
            let mut agents = skill.agents;
            if agents.is_empty() && skill.canonical {
                agents.push("Universal".to_string());
            }
            agents.sort();
            agents.dedup();

            SkillInfo {
                name: skill.name,
                path: skill.path.to_string_lossy().into_owned(),
                scope: scope_label.to_string(),
                agents,
                source: meta.and_then(|m| m.source.clone()),
                source_url: meta.and_then(|m| m.source_url.clone()),
                source_type: meta.and_then(|m| m.source_type.clone()),
                installed_at: meta.and_then(|m| m.installed_at.clone()),
                updated_at: meta.and_then(|m| m.updated_at.clone()),
            }
        })
        .collect()
}

fn skill_roots(scope: &Scope, base: &Path) -> Vec<SkillRoot> {
    let mut roots: Vec<SkillRoot> = Vec::new();
    let mut seen: HashSet<PathBuf> = HashSet::new();

    let mut push = |path: PathBuf, agent: Option<&str>, canonical: bool| {
        if !seen.insert(path.clone()) || !path.is_dir() {
            return;
        }
        roots.push(SkillRoot {
            path,
            agent: agent.map(str::to_string),
            canonical,
        });
    };

    push(base.join(".agents").join("skills"), None, true);

    if let Ok(entries) = std::fs::read_dir(base) {
        for entry in entries.flatten() {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            if !name.starts_with('.')
                || name == ".config"
                || SKIP_DIRS.contains(&name.as_str())
                || !path.is_dir()
            {
                continue;
            }
            let skills = path.join("skills");
            if skills.is_dir() {
                let label = (name != ".agents").then(|| agent_label(&name));
                push(skills, label.as_deref(), false);
            }
        }
    }

    if matches!(scope, Scope::Global) {
        let config = config_home(base);
        if let Ok(entries) = std::fs::read_dir(&config) {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_dir() {
                    continue;
                }
                let name = entry.file_name().to_string_lossy().to_string();
                let label = config_label(&name);
                let skills = path.join("skills");
                if skills.is_dir() {
                    push(skills, Some(&label), false);
                }
                let harness = path.join("harness").join("skills");
                if harness.is_dir() {
                    push(harness, Some(&label), false);
                }
            }
        }

        for (path, label) in nested_global_roots(base, &config) {
            push(path, Some(label), false);
        }

        for (env, label) in [
            ("CLAUDE_CONFIG_DIR", "Claude Code"),
            ("VIBE_HOME", "Mistral Vibe"),
            ("HERMES_HOME", "Hermes Agent"),
            ("AUTOHAND_HOME", "Autohand Code CLI"),
            ("GROK_HOME", "Grok Build"),
            ("SARVAM_HOME", "Sarvam Code"),
        ] {
            if let Some(dir) = std::env::var_os(env) {
                push(PathBuf::from(dir).join("skills"), Some(label), false);
            }
        }
    } else {
        push(base.join("data").join("skills"), Some("AstrBot"), false);
        push(base.join("agent").join("skills"), Some("Eve"), false);
        push(
            base.join(".posit").join("assistant").join("skills"),
            Some("Posit Assistant"),
            false,
        );
        push(
            base.join(".tabnine").join("agent").join("skills"),
            Some("Tabnine CLI"),
            false,
        );
        if openclaw_installed() {
            push(base.join("skills"), Some("OpenClaw"), false);
        }
    }

    roots
}

fn config_home(home: &Path) -> PathBuf {
    std::env::var_os("XDG_CONFIG_HOME")
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| home.join(".config"))
}

fn nested_global_roots(home: &Path, config: &Path) -> Vec<(PathBuf, &'static str)> {
    vec![
        (
            home.join(".gemini").join("antigravity").join("skills"),
            "Antigravity",
        ),
        (
            home.join(".gemini").join("antigravity-cli").join("skills"),
            "Antigravity CLI",
        ),
        (
            home.join(".snowflake").join("cortex").join("skills"),
            "Cortex Code",
        ),
        (
            home.join(".codeium").join("windsurf").join("skills"),
            "Windsurf",
        ),
        (
            home.join(".posit").join("assistant").join("skills"),
            "Posit Assistant",
        ),
        (
            home.join(".tabnine").join("agent").join("skills"),
            "Tabnine CLI",
        ),
        (
            config.join("kimchi").join("harness").join("skills"),
            "Kimchi",
        ),
        (home.join(".astrbot").join("data").join("skills"), "AstrBot"),
        (
            home.join(".deepagents").join("agent").join("skills"),
            "Deep Agents",
        ),
    ]
}

fn openclaw_installed() -> bool {
    let Some(home) = dirs::home_dir() else {
        return false;
    };
    home.join(".openclaw").is_dir()
        || home.join(".clawdbot").is_dir()
        || home.join(".moltbot").is_dir()
}

fn config_label(dir: &str) -> String {
    match dir {
        "agents" => "Amp".to_string(),
        "opencode" => "OpenCode".to_string(),
        "goose" => "Goose".to_string(),
        "crush" => "Crush".to_string(),
        "devin" => "Devin for Terminal".to_string(),
        "kimchi" => "Kimchi".to_string(),
        _ => agent_label(dir),
    }
}

fn agent_label(dir: &str) -> String {
    let name = dir.trim_start_matches('.');
    match name {
        "aider-desk" => "AiderDesk",
        "autohand" => "Autohand Code CLI",
        "augment" => "Augment",
        "bob" => "IBM Bob",
        "claude" => "Claude Code",
        "codeartsdoer" => "CodeArts Agent",
        "codebuddy" => "CodeBuddy",
        "codemaker" => "Codemaker",
        "codestudio" => "Code Studio",
        "codex" => "Codex",
        "commandcode" => "Command Code",
        "continue" => "Continue",
        "cortex" => "Cortex Code",
        "crush" => "Crush",
        "cursor" => "Cursor",
        "devin" => "Devin for Terminal",
        "factory" => "Droid",
        "firebender" => "Firebender",
        "forge" => "ForgeCode",
        "gemini" => "Gemini CLI",
        "github" => "GitHub Copilot",
        "goose" => "Goose",
        "grok" => "Grok Build",
        "hermes" => "Hermes Agent",
        "iflow" => "iFlow CLI",
        "inferencesh" => "inference.sh",
        "jazz" => "Jazz",
        "junie" => "Junie",
        "kilo" => "Kilo Code",
        "kimchi" => "Kimchi",
        "kiro" => "Kiro CLI",
        "kode" => "Kode",
        "lingma" => "Lingma",
        "mcpjam" => "MCPJam",
        "minimax" => "MiniMax Code",
        "moxby" => "Moxby",
        "mux" => "Mux",
        "neovate" => "Neovate",
        "ona" => "Ona",
        "openclaw" | "clawdbot" | "moltbot" => "OpenClaw",
        "openhands" => "OpenHands",
        "pi" => "Pi",
        "pochi" => "Pochi",
        "qoder" => "Qoder",
        "qoder-cn" => "Qoder CN",
        "qwen" => "Qwen Code",
        "reasonix" => "Reasonix",
        "roo" => "Roo Code",
        "rovodev" => "Rovo Dev",
        "tabnine" => "Tabnine CLI",
        "terramind" => "Terramind",
        "tinycloud" => "Tinycloud",
        "trae" => "Trae",
        "trae-cn" => "Trae CN",
        "vibe" => "Mistral Vibe",
        "windsurf" => "Windsurf",
        "zcode" => "ZCode",
        "zencoder" => "Zencoder",
        "adal" => "AdaL",
        _ => return pretty_name(name),
    }
    .to_string()
}

fn pretty_name(name: &str) -> String {
    name.split(['-', '_', '.'])
        .filter(|part| !part.is_empty())
        .map(|part| {
            let mut chars = part.chars();
            match chars.next() {
                Some(first) => first.to_uppercase().chain(chars).collect::<String>(),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn parse_skill_md(path: &Path) -> Option<(String, String)> {
    let raw = std::fs::read_to_string(path).ok()?;
    let front = frontmatter(&raw)?;
    let docs = YamlLoader::load_from_str(front).ok()?;
    let map = docs.first()?.as_hash()?;
    let name = map.get(&Yaml::String("name".to_string()))?.as_str()?.trim();
    let description = map
        .get(&Yaml::String("description".to_string()))?
        .as_str()?
        .trim();
    if name.is_empty() || description.is_empty() {
        return None;
    }
    Some((name.to_string(), description.to_string()))
}

fn frontmatter(raw: &str) -> Option<&str> {
    let raw = raw.strip_prefix('\u{feff}').unwrap_or(raw);
    let first_end = raw.find('\n')?;
    if raw[..first_end].trim_end_matches('\r') != "---" {
        return None;
    }
    let start = first_end + 1;
    let mut line_start = start;
    for (offset, _) in raw[start..].match_indices('\n') {
        let line_end = start + offset;
        if raw[line_start..line_end].trim_end_matches('\r') == "---" {
            return raw.get(start..line_start);
        }
        line_start = line_end + 1;
    }
    if raw[line_start..].trim_end_matches('\r') == "---" {
        return raw.get(start..line_start);
    }
    None
}

fn lock_entry<'a>(lock: &'a SkillLockFile, name: &str) -> Option<&'a SkillLockEntry> {
    lock.skills
        .get(name)
        .or_else(|| lock.skills.get(&sanitize_name(name)))
}

fn sanitize_name(name: &str) -> String {
    let mut out = String::new();
    for ch in name.chars() {
        let next = if ch.is_ascii_alphanumeric() || ch == '.' || ch == '_' {
            ch.to_ascii_lowercase()
        } else {
            '-'
        };
        if next == '-' && out.ends_with('-') {
            continue;
        }
        out.push(next);
    }
    let trimmed = out.trim_matches(|c| c == '.' || c == '-');
    if trimmed.is_empty() {
        "unnamed-skill".to_string()
    } else {
        trimmed.chars().take(255).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "curie-scan-{tag}-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

    fn write_skill(root: &Path, relative: &str, name: &str, description: &str) -> PathBuf {
        let dir = root.join(relative);
        fs::create_dir_all(&dir).expect("skill dir");
        fs::write(
            dir.join(SKILL_FILE),
            format!("---\nname: {name}\ndescription: {description}\n---\n\nBody.\n"),
        )
        .expect("skill file");
        dir
    }

    fn empty_lock() -> SkillLockFile {
        SkillLockFile::default()
    }

    #[test]
    fn parses_plain_quoted_and_block_frontmatter() {
        assert_eq!(
            parse_skill_md_text("---\nname: alpha\ndescription: First skill\n---\n"),
            Some(("alpha".into(), "First skill".into()))
        );
        assert_eq!(
            parse_skill_md_text("---\nname: \"alpha\"\ndescription: 'First: skill'\n---\n"),
            Some(("alpha".into(), "First: skill".into()))
        );
        assert_eq!(
            parse_skill_md_text(
                "---\nname: alpha\ndescription: |\n  First line\n  second line\n---\n"
            ),
            Some(("alpha".into(), "First line\nsecond line".into()))
        );
    }

    #[test]
    fn rejects_frontmatter_without_a_description_or_name() {
        assert!(parse_skill_md_text("---\nname: alpha\n---\n").is_none());
        assert!(parse_skill_md_text("---\ndescription: nope\n---\n").is_none());
        assert!(parse_skill_md_text("no frontmatter").is_none());
        assert!(parse_skill_md_text("---\nname: [bad\n---\n").is_none());
    }

    #[test]
    fn accepts_a_bom_before_the_frontmatter() {
        assert_eq!(
            parse_skill_md_text("\u{feff}---\r\nname: alpha\r\ndescription: hi\r\n---\r\n"),
            Some(("alpha".into(), "hi".into()))
        );
    }

    #[test]
    fn lists_canonical_and_agent_skills_once() {
        let root = temp_dir("project");
        let canonical = write_skill(&root, ".agents/skills/alpha", "alpha", "Alpha skill");
        write_skill(&root, ".claude/skills/alpha", "alpha", "Alpha skill");
        let beta_path = write_skill(&root, ".claude/skills/beta", "beta", "Beta skill");
        write_skill(&root, ".claude/skills/broken", "broken", "");
        fs::create_dir_all(root.join(".claude/skills/empty")).expect("empty dir");
        fs::write(root.join(".claude/skills/empty/README.md"), "not a skill").expect("readme");

        let skills = scan_at(&Scope::Project(root.clone()), &root, &empty_lock());

        let names: Vec<&str> = skills.iter().map(|s| s.name.as_str()).collect();
        assert_eq!(names, vec!["alpha", "beta"]);

        let alpha = skills.iter().find(|s| s.name == "alpha").expect("alpha");
        assert_eq!(PathBuf::from(&alpha.path), canonical);
        assert_eq!(alpha.agents, vec!["Claude Code"]);

        let beta = skills.iter().find(|s| s.name == "beta").expect("beta");
        assert_eq!(PathBuf::from(&beta.path), beta_path);
        assert_eq!(beta.agents, vec!["Claude Code"]);

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn marks_a_canonical_skill_as_universal_when_no_agent_links_it() {
        let root = temp_dir("universal");
        write_skill(&root, ".agents/skills/alpha", "alpha", "Alpha skill");

        let skills = scan_at(&Scope::Project(root.clone()), &root, &empty_lock());

        assert_eq!(skills.len(), 1);
        assert_eq!(skills[0].agents, vec!["Universal"]);

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn reads_metadata_from_the_lockfile_by_exact_or_sanitized_name() {
        let root = temp_dir("lock");
        write_skill(&root, ".agents/skills/alpha", "Alpha Skill", "Alpha skill");
        let lock: SkillLockFile = serde_json::from_value(serde_json::json!({
            "skills": {
                "alpha-skill": {
                    "source": "owner/repo",
                    "sourceType": "github",
                    "sourceUrl": "https://github.com/owner/repo",
                    "installedAt": "2026-01-01T00:00:00.000Z",
                    "updatedAt": "2026-01-02T00:00:00.000Z"
                }
            }
        }))
        .expect("lock");

        let skills = scan_at(&Scope::Project(root.clone()), &root, &lock);

        assert_eq!(skills[0].source.as_deref(), Some("owner/repo"));
        assert_eq!(skills[0].source_type.as_deref(), Some("github"));
        assert_eq!(
            skills[0].source_url.as_deref(),
            Some("https://github.com/owner/repo")
        );
        assert_eq!(
            skills[0].installed_at.as_deref(),
            Some("2026-01-01T00:00:00.000Z")
        );

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn lists_global_skills_from_the_canonical_and_agent_directories() {
        let home = temp_dir("global");
        write_skill(&home, ".agents/skills/alpha", "alpha", "Alpha skill");
        write_skill(&home, ".claude/skills/beta", "beta", "Beta skill");

        let skills = scan_at(&Scope::Global, &home, &empty_lock());

        assert!(skills
            .iter()
            .any(|s| s.name == "beta" && s.path.ends_with(".claude/skills/beta")));
        assert!(skills
            .iter()
            .any(|s| s.name == "alpha" && s.path.ends_with(".agents/skills/alpha")));

        let _ = fs::remove_dir_all(&home);
    }

    #[cfg(unix)]
    #[test]
    fn follows_a_symlinked_agent_skill_to_the_canonical_path() {
        use std::os::unix::fs::symlink;

        let root = temp_dir("symlink");
        let canonical = write_skill(&root, ".agents/skills/alpha", "alpha", "Alpha skill");
        let agent_root = root.join(".claude/skills");
        fs::create_dir_all(&agent_root).expect("agent dir");
        symlink(&canonical, agent_root.join("alpha")).expect("symlink");

        let skills = scan_at(&Scope::Project(root.clone()), &root, &empty_lock());

        assert_eq!(skills.len(), 1);
        assert_eq!(PathBuf::from(&skills[0].path), canonical);
        assert_eq!(skills[0].agents, vec!["Claude Code"]);

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn covers_the_nested_global_agent_directories() {
        let home = PathBuf::from("/tmp/curie-home");
        let config = PathBuf::from("/tmp/curie-config");
        let roots = nested_global_roots(&home, &config);

        assert!(roots.iter().any(|(path, label)| {
            path == &home.join(".astrbot/data/skills") && *label == "AstrBot"
        }));
        assert!(roots.iter().any(|(path, label)| {
            path == &home.join(".deepagents/agent/skills") && *label == "Deep Agents"
        }));
        assert_eq!(agent_label(".qoder-cn"), "Qoder CN");
        assert_eq!(agent_label(".trae-cn"), "Trae CN");
    }

    #[test]
    fn sanitizes_lockfile_keys_like_the_cli() {
        assert_eq!(sanitize_name("Alpha Skill"), "alpha-skill");
        assert_eq!(sanitize_name("  ...  "), "unnamed-skill");
        assert_eq!(sanitize_name("a//b"), "a-b");
    }

    fn parse_skill_md_text(raw: &str) -> Option<(String, String)> {
        let dir = temp_dir("parse");
        let path = dir.join(SKILL_FILE);
        fs::write(&path, raw).expect("write");
        let parsed = parse_skill_md(&path);
        let _ = fs::remove_dir_all(&dir);
        parsed
    }
}
