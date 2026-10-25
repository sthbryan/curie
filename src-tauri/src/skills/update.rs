use std::path::PathBuf;

use super::add::lock_entry;
use super::check::fetch_github_tree;
use super::install::{self, Targets};
use super::lock;
use super::scan::sanitize_name;
use super::scope::Scope;
use super::source::{acquire, discover_skills, parse_source, DiscoveredSkill, Source, SourceDir};
use super::types::{GitTreeResponse, SkillLockEntry, SkillLockFile, SkillUpdateResult};

fn same_name(a: &str, b: &str) -> bool {
    a.eq_ignore_ascii_case(b) || sanitize_name(a) == sanitize_name(b)
}

fn resolve_entry_source(scope: &Scope, entry: &SkillLockEntry) -> Result<Source, String> {
    if entry.source_type.as_deref() == Some("local") {
        let source = entry
            .source
            .as_deref()
            .filter(|source| !source.trim().is_empty())
            .ok_or("the lock entry has no source")?;
        let mut path = PathBuf::from(source);
        if !path.is_absolute() {
            if let Scope::Project(root) = scope {
                path = root.join(path);
            }
        }
        if !path.exists() {
            return Err(format!("source folder is missing: {}", path.display()));
        }
        return Ok(Source::Local(path));
    }

    let url = entry
        .source_url
        .clone()
        .filter(|url| !url.trim().is_empty())
        .or_else(|| entry.source.clone())
        .ok_or("the lock entry has no source")?;
    let package = match entry.r#ref.as_deref().filter(|r| !r.is_empty()) {
        Some(reference) => format!("{url}#{reference}"),
        None => url,
    };
    parse_source(&package)
}

fn locate<'a>(
    workspace: &SourceDir,
    discovered: &'a [DiscoveredSkill],
    name: &str,
    entry: &SkillLockEntry,
) -> Option<&'a DiscoveredSkill> {
    if let Some(path) = entry.skill_path.as_deref() {
        if let Some(skill) = discovered
            .iter()
            .find(|skill| workspace.skill_path(&skill.dir) == path)
        {
            return Some(skill);
        }
    }
    discovered.iter().find(|skill| same_name(&skill.name, name))
}

enum Refresh {
    Updated,
    UpToDate,
}

fn refresh(
    scope: &Scope,
    targets: &Targets,
    lock: &SkillLockFile,
    name: &str,
    entry: &SkillLockEntry,
    source: &Source,
    workspace: &SourceDir,
    tree: Option<&GitTreeResponse>,
) -> Result<Refresh, String> {
    let discovered = discover_skills(&workspace.root, source.subpath())?;
    let Some(skill) = locate(workspace, &discovered, name, entry) else {
        return Err("the skill is no longer in the source repository".into());
    };

    let installed = targets.canonical.join(sanitize_name(name));
    let local_hash = install::folder_hash(&installed);
    let remote_hash = install::folder_hash(&skill.dir);
    if local_hash.is_some() && local_hash == remote_hash {
        return Ok(Refresh::UpToDate);
    }

    install::install_skill(targets, &skill.dir, &skill.name)?;
    let updated = lock_entry(scope, source, workspace, skill, tree, lock);
    lock::write_lock_entry(scope, name, updated)?;
    Ok(Refresh::Updated)
}

pub fn update_skills_in(
    scope: &Scope,
    skills: Option<Vec<String>>,
) -> Result<SkillUpdateResult, String> {
    let requested: Vec<String> = skills
        .unwrap_or_default()
        .into_iter()
        .map(|name| name.trim().to_string())
        .filter(|name| !name.is_empty())
        .collect();

    let lock = lock::load_skill_lock(scope);
    let mut entries: Vec<(String, SkillLockEntry)> = lock
        .skills
        .iter()
        .filter(|(name, _)| {
            requested.is_empty() || requested.iter().any(|wanted| same_name(wanted, name))
        })
        .map(|(name, entry)| (name.clone(), entry.clone()))
        .collect();
    entries.sort_by(|a, b| a.0.cmp(&b.0));

    if entries.is_empty() {
        return Ok(SkillUpdateResult {
            updated: Vec::new(),
            message: if requested.is_empty() {
                "No skills to update".into()
            } else {
                format!("No matching skills found for: {}", requested.join(", "))
            },
        });
    }

    let targets = install::targets(scope)?;
    let mut updated: Vec<String> = Vec::new();
    let mut up_to_date = 0usize;
    let mut failures: Vec<String> = Vec::new();

    // Remote skills are cloned once per repository + ref; local skills read
    // their own folder, so each one stands alone.
    let mut groups: Vec<(String, Vec<(String, SkillLockEntry)>)> = Vec::new();
    let mut locals: Vec<(String, SkillLockEntry, Source)> = Vec::new();

    for (name, entry) in entries {
        match resolve_entry_source(scope, &entry) {
            Ok(Source::Local(path)) => locals.push((name, entry, Source::Local(path))),
            Ok(Source::Git(_)) => {
                let key = format!(
                    "{}\u{1f}{}",
                    entry
                        .source_url
                        .clone()
                        .or_else(|| entry.source.clone())
                        .unwrap_or_default(),
                    entry.r#ref.clone().unwrap_or_default()
                );
                match groups.iter_mut().find(|(existing, _)| *existing == key) {
                    Some((_, items)) => items.push((name, entry)),
                    None => groups.push((key, vec![(name, entry)])),
                }
            }
            Err(error) => failures.push(format!("{name}: {error}")),
        }
    }

    for (name, entry, source) in &locals {
        let workspace = match acquire(source) {
            Ok(workspace) => workspace,
            Err(error) => {
                failures.push(format!("{name}: {error}"));
                continue;
            }
        };
        match refresh(
            scope, &targets, &lock, name, entry, source, &workspace, None,
        ) {
            Ok(Refresh::Updated) => updated.push(name.clone()),
            Ok(Refresh::UpToDate) => up_to_date += 1,
            Err(error) => failures.push(format!("{name}: {error}")),
        }
    }

    for (_key, items) in &groups {
        let (_, entry) = &items[0];
        let source = match resolve_entry_source(scope, entry) {
            Ok(source) => source,
            Err(error) => {
                failures.push(format!("{}: {error}", items[0].0));
                continue;
            }
        };
        let workspace = match acquire(&source) {
            Ok(workspace) => workspace,
            Err(error) => {
                for (name, _) in items {
                    failures.push(format!("{name}: {error}"));
                }
                continue;
            }
        };
        let tree = match (&source, scope) {
            (Source::Git(git), Scope::Global) if git.owner_repo.is_some() => git
                .owner_repo
                .as_deref()
                .and_then(|repo| fetch_github_tree(repo, git.ref_name.as_deref(), true)),
            _ => None,
        };

        for (name, entry) in items {
            let result = match tree.as_ref() {
                Some(tree) => refresh(
                    scope,
                    &targets,
                    &lock,
                    name,
                    entry,
                    &source,
                    &workspace,
                    Some(tree),
                ),
                None => refresh(
                    scope, &targets, &lock, name, entry, &source, &workspace, None,
                ),
            };
            match result {
                Ok(Refresh::Updated) => updated.push(name.clone()),
                Ok(Refresh::UpToDate) => up_to_date += 1,
                Err(error) => failures.push(format!("{name}: {error}")),
            }
        }
    }

    let mut message = if updated.is_empty() {
        if failures.is_empty() {
            "All skills are up to date".to_string()
        } else {
            "No skills were updated".to_string()
        }
    } else {
        format!("Updated {}", updated.join(", "))
    };
    if up_to_date > 0 {
        message.push_str(&format!(" · {up_to_date} already up to date"));
    }
    if !failures.is_empty() {
        message.push_str(&format!(" · failed: {}", failures.join("; ")));
    }

    Ok(SkillUpdateResult { updated, message })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "curie-update-{tag}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

    fn write_skill(dir: &std::path::Path, name: &str, body: &str) {
        fs::create_dir_all(dir).expect("skill dir");
        fs::write(
            dir.join("SKILL.md"),
            format!("---\nname: {name}\ndescription: {name} skill\n---\n\n{body}\n"),
        )
        .expect("skill file");
    }

    fn seed_project(project: &std::path::Path, source: &std::path::Path) -> String {
        let result = crate::skills::add::install_source(
            &Scope::Project(project.to_path_buf()),
            &Source::Local(source.to_path_buf()),
            None,
        )
        .expect("install");
        result
    }

    #[test]
    fn a_matching_source_is_already_up_to_date() {
        let project = temp_dir("same");
        let source = temp_dir("same-source");
        write_skill(&source, "alpha", "first");
        seed_project(&project, &source);

        let result = update_skills_in(&Scope::Project(project.clone()), None).expect("update");
        assert!(result.updated.is_empty());
        assert!(result.message.contains("up to date"));

        let _ = fs::remove_dir_all(&project);
        let _ = fs::remove_dir_all(&source);
    }

    #[test]
    fn an_edited_local_source_is_copied_again() {
        let project = temp_dir("edited");
        let source = temp_dir("edited-source");
        write_skill(&source, "alpha", "first");
        seed_project(&project, &source);

        write_skill(&source, "alpha", "second");
        let result = update_skills_in(&Scope::Project(project.clone()), Some(vec!["alpha".into()]))
            .expect("update");

        assert_eq!(result.updated, vec!["alpha"]);
        let installed =
            fs::read_to_string(project.join(".agents/skills/alpha/SKILL.md")).expect("read");
        assert!(installed.contains("second"));

        let _ = fs::remove_dir_all(&project);
        let _ = fs::remove_dir_all(&source);
    }

    #[test]
    fn unknown_names_report_the_matching_error() {
        let project = temp_dir("unknown");
        let result = update_skills_in(&Scope::Project(project.clone()), Some(vec!["nope".into()]))
            .expect("update");

        assert!(result.updated.is_empty());
        assert!(result.message.contains("No matching skills found"));

        let _ = fs::remove_dir_all(&project);
    }

    #[test]
    fn an_empty_lock_says_there_is_nothing_to_update() {
        let project = temp_dir("empty");
        let result = update_skills_in(&Scope::Project(project.clone()), None).expect("update");

        assert_eq!(result.message, "No skills to update");
        let _ = fs::remove_dir_all(&project);
    }
}
