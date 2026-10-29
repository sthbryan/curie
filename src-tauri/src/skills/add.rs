use serde_json::{json, Map, Value};

use crate::errors::{coded, key};

use super::check::fetch_github_tree;
use super::install;
use super::lock;
use super::scan::sanitize_name;
use super::scope::Scope;
use super::source::{acquire, discover_skills, parse_source, DiscoveredSkill, Source, SourceDir};
use super::types::{GitTreeResponse, SkillInstallResult, SkillLockFile};

pub fn add_skill_in(
    scope: &Scope,
    package: &str,
    skill_name: Option<&str>,
) -> Result<SkillInstallResult, String> {
    let package = package.trim();
    if package.is_empty() {
        return Err(coded(key::PACKAGE_REQUIRED));
    }
    if package.starts_with('-') || package.contains(char::is_whitespace) {
        return Err(coded(key::PACKAGE_INVALID));
    }

    let source = parse_source(package)?;
    let message = install_source(scope, &source, skill_name)?;

    Ok(SkillInstallResult {
        package: package.to_string(),
        message,
    })
}

fn matches_wanted(skill: &DiscoveredSkill, wanted: &[String]) -> bool {
    wanted.iter().any(|name| {
        let name = name.trim().to_lowercase();
        skill.name.to_lowercase() == name || sanitize_name(&skill.name) == sanitize_name(&name)
    })
}

pub(crate) fn lock_entry(
    scope: &Scope,
    source: &Source,
    workspace: &SourceDir,
    skill: &DiscoveredSkill,
    tree: Option<&GitTreeResponse>,
    lock: &SkillLockFile,
) -> Value {
    let skill_path = workspace.skill_path(&skill.dir);
    let mut entry = Map::new();
    entry.insert("source".into(), json!(source.lock_source()));
    entry.insert("sourceType".into(), json!(source.source_type()));
    if source.needs_source_url(matches!(scope, Scope::Global)) {
        entry.insert("sourceUrl".into(), json!(source.url()));
    }
    if let Some(reference) = source.ref_name() {
        entry.insert("ref".into(), json!(reference));
    }
    entry.insert("skillPath".into(), json!(skill_path));

    let existing = lock
        .skills
        .get(&skill.name)
        .or_else(|| lock.skills.get(&sanitize_name(&skill.name)));
    // A reinstall without a GitHub tree (project scope, offline, local source)
    // must not drop the hash the update check compares against.
    let folder_hash = tree
        .and_then(|tree| super::check::latest_folder_hash(tree, &skill_path))
        .filter(|hash| !hash.is_empty())
        .or_else(|| existing.and_then(|entry| entry.skill_folder_hash.clone()))
        .filter(|hash| !hash.is_empty());

    match scope {
        Scope::Global => {
            let installed_at = existing
                .and_then(|entry| entry.installed_at.clone())
                .unwrap_or_else(lock::now_iso8601);
            entry.insert("installedAt".into(), json!(installed_at));
            entry.insert("updatedAt".into(), json!(lock::now_iso8601()));
            entry.insert(
                "skillFolderHash".into(),
                json!(folder_hash.unwrap_or_default()),
            );
        }
        Scope::Project(_) => {
            let computed = install::folder_hash(&skill.dir).unwrap_or_default();
            entry.insert("computedHash".into(), json!(computed));
            if let Some(hash) = folder_hash {
                entry.insert("skillFolderHash".into(), json!(hash));
            }
        }
    }

    Value::Object(entry)
}

/// Installs every selected skill from an already resolved source and returns
/// the user-facing summary.
pub(crate) fn install_source(
    scope: &Scope,
    source: &Source,
    skill_name: Option<&str>,
) -> Result<String, String> {
    let wanted: Vec<String> = skill_name
        .map(str::trim)
        .filter(|name| !name.is_empty())
        .map(|name| vec![name.to_string()])
        .or_else(|| source.skill_filter().map(|name| vec![name.to_string()]))
        .unwrap_or_default();

    let workspace = acquire(source)?;
    let discovered = discover_skills(&workspace.root, source.subpath())?;
    let selected: Vec<DiscoveredSkill> = if wanted.is_empty() {
        discovered
            .into_iter()
            .filter(|skill| !skill.internal)
            .collect()
    } else {
        discovered
            .into_iter()
            .filter(|skill| matches_wanted(skill, &wanted))
            .collect()
    };

    if selected.is_empty() {
        return Err(if wanted.is_empty() {
            "No valid skills found. Skills require a SKILL.md with name and description.".into()
        } else {
            format!("No matching skills found for: {}", wanted.join(", "))
        });
    }

    let targets = install::targets(scope)?;
    let lock = lock::load_skill_lock(scope);
    // Both scopes record the folder hash: it is the baseline the update check
    // compares against, and without it project skills can never show an update.
    let tree = match source {
        Source::Git(git) => git
            .owner_repo
            .as_deref()
            .and_then(|repo| fetch_github_tree(repo, git.ref_name.as_deref(), true)),
        Source::Local(_) => None,
    };

    let mut installed: Vec<String> = Vec::new();
    let mut failures: Vec<String> = Vec::new();

    for skill in &selected {
        let entry = lock_entry(scope, source, &workspace, skill, tree.as_ref(), &lock);
        match install::install_skill(&targets, &skill.dir, &skill.name) {
            Ok(_) => {
                lock::write_lock_entry(scope, &skill.name, entry)?;
                installed.push(skill.name.clone());
            }
            Err(e) => failures.push(format!("{}: {e}", skill.name)),
        }
    }

    if installed.is_empty() {
        return Err(format!("Failed to install: {}", failures.join("; ")));
    }

    let mut message = format!("Installed {}", installed.join(", "));
    if !failures.is_empty() {
        message.push_str(&format!("; failed: {}", failures.join("; ")));
    }
    Ok(message)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "curie-add-{tag}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

    fn write_skill(root: &std::path::Path, relative: &str, name: &str) {
        let dir = root.join(relative);
        fs::create_dir_all(&dir).expect("skill dir");
        fs::write(
            dir.join("SKILL.md"),
            format!("---\nname: {name}\ndescription: {name} skill\n---\n"),
        )
        .expect("skill file");
    }

    #[test]
    fn installs_a_local_package_and_writes_the_project_lock() {
        let project = temp_dir("project");
        fs::create_dir_all(project.join(".claude")).expect("agent");
        let source = temp_dir("local");
        write_skill(&source, "", "alpha");

        install_source(
            &Scope::Project(project.clone()),
            &Source::Local(source.clone()),
            None,
        )
        .expect("install");

        assert!(project.join(".agents/skills/alpha/SKILL.md").is_file());
        assert!(project.join(".claude/skills/alpha").exists());

        let lock: Value = serde_json::from_str(
            &fs::read_to_string(project.join("skills-lock.json")).expect("lock"),
        )
        .expect("json");
        assert_eq!(lock["version"], 1);
        assert_eq!(lock["skills"]["alpha"]["sourceType"], "local");
        assert_eq!(lock["skills"]["alpha"]["skillPath"], "SKILL.md");
        assert!(
            lock["skills"]["alpha"]["computedHash"]
                .as_str()
                .unwrap()
                .len()
                == 64
        );

        let _ = fs::remove_dir_all(&project);
        let _ = fs::remove_dir_all(&source);
    }

    #[test]
    fn a_project_reinstall_keeps_the_folder_hash_it_cannot_recompute() {
        let project = temp_dir("keep-hash");
        let source = temp_dir("keep-hash-source");
        write_skill(&source, "", "alpha");
        fs::write(
            project.join("skills-lock.json"),
            serde_json::json!({
                "version": 1,
                "skills": {
                    "alpha": {
                        "source": "one/alpha",
                        "sourceType": "github",
                        "skillPath": "SKILL.md",
                        "skillFolderHash": "kept-hash",
                    }
                }
            })
            .to_string(),
        )
        .expect("lock");

        install_source(
            &Scope::Project(project.clone()),
            &Source::Local(source.clone()),
            None,
        )
        .expect("install");

        let lock: Value = serde_json::from_str(
            &fs::read_to_string(project.join("skills-lock.json")).expect("lock"),
        )
        .expect("json");
        assert_eq!(lock["skills"]["alpha"]["skillFolderHash"], "kept-hash");

        let _ = fs::remove_dir_all(&project);
        let _ = fs::remove_dir_all(&source);
    }

    #[test]
    fn a_named_skill_selects_only_that_folder() {
        let project = temp_dir("select");
        let source = temp_dir("select-source");
        write_skill(&source, "skills/alpha", "alpha");
        write_skill(&source, "skills/beta", "beta");

        install_source(
            &Scope::Project(project.clone()),
            &Source::Local(source.clone()),
            Some("beta"),
        )
        .expect("install");

        assert!(project.join(".agents/skills/beta/SKILL.md").is_file());
        assert!(!project.join(".agents/skills/alpha").exists());

        let _ = fs::remove_dir_all(&project);
        let _ = fs::remove_dir_all(&source);
    }

    #[test]
    fn an_unknown_skill_name_reports_the_available_error() {
        let project = temp_dir("unknown");
        let source = temp_dir("unknown-source");
        write_skill(&source, "skills/alpha", "alpha");

        let error = install_source(
            &Scope::Project(project.clone()),
            &Source::Local(source.clone()),
            Some("nope"),
        )
        .unwrap_err();
        assert!(error.contains("No matching skills found"));

        let _ = fs::remove_dir_all(&project);
        let _ = fs::remove_dir_all(&source);
    }

    #[test]
    fn an_empty_package_is_rejected() {
        assert!(add_skill_in(&Scope::Global, "   ", None).is_err());
        assert!(add_skill_in(&Scope::Global, "--flag", None).is_err());
    }

    #[test]
    fn internal_skills_are_skipped_unless_named() {
        let project = temp_dir("internal");
        let source = temp_dir("internal-source");
        let dir = source.join("skills/hidden");
        fs::create_dir_all(&dir).expect("skill dir");
        fs::write(
            dir.join("SKILL.md"),
            "---\nname: hidden\ndescription: Secret\nmetadata:\n  internal: true\n---\n",
        )
        .expect("skill file");

        let error = install_source(
            &Scope::Project(project.clone()),
            &Source::Local(source.clone()),
            None,
        )
        .unwrap_err();
        assert!(error.contains("No valid skills found"));

        install_source(
            &Scope::Project(project.clone()),
            &Source::Local(source.clone()),
            Some("hidden"),
        )
        .expect("named install");
        assert!(project.join(".agents/skills/hidden/SKILL.md").is_file());

        let _ = fs::remove_dir_all(&project);
        let _ = fs::remove_dir_all(&source);
    }
}
