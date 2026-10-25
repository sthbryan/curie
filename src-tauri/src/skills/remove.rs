use std::fs;
use std::path::PathBuf;

use crate::errors::{coded, coded_with, key};

use super::install::{self, Targets};
use super::lock;
use super::scan::{read_skill_meta, sanitize_name, scan_skills};
use super::scope::Scope;
use super::types::SkillRemoveResult;

fn validate_name(name: &str) -> Result<&str, String> {
    let name = name.trim();
    // A skill name is matched against SKILL.md, so it may carry spaces; only
    // path-like input could escape the skills directory.
    let path_like = name.contains(['/', '\\']) || name.contains("..");
    if name.is_empty() || name.starts_with('-') || path_like {
        return Err(coded_with(key::SKILL_NAME_INVALID, name));
    }
    Ok(name)
}

fn remove_named(targets: &Targets, names: &[String]) -> Vec<String> {
    let mut removed = Vec::new();
    let mut roots: Vec<&PathBuf> = targets.links.iter().collect();
    roots.push(&targets.canonical);

    for name in names {
        let Ok(wanted) = validate_name(name.trim()) else {
            continue;
        };

        // The folder is usually the sanitized name, but a hand-made folder may
        // carry a different directory name with the real one in SKILL.md.
        let mut folders: Vec<String> = vec![sanitize_name(wanted)];
        for root in &roots {
            if let Ok(entries) = fs::read_dir(root) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if !path.is_dir() {
                        continue;
                    }
                    let folder = entry.file_name().to_string_lossy().to_string();
                    if folders.contains(&folder) {
                        continue;
                    }
                    if let Some(meta) = read_skill_meta(&path.join("SKILL.md")) {
                        if meta.name.eq_ignore_ascii_case(wanted) {
                            folders.push(folder);
                        }
                    }
                }
            }
        }

        let mut hit = false;
        for folder in folders {
            hit |= install::remove_skill(targets, &folder);
        }
        if hit {
            removed.push(wanted.to_string());
        }
    }
    removed
}

pub fn remove_skills_in(scope: &Scope, skills: &[String]) -> Result<SkillRemoveResult, String> {
    if skills.is_empty() {
        return Err(coded(key::SKILL_NAME_REQUIRED));
    }
    for name in skills {
        validate_name(name)?;
    }

    let targets = install::targets(scope)?;
    let removed = remove_named(&targets, skills);
    for name in &removed {
        lock::remove_lock_entry(scope, name);
    }

    let message = if removed.is_empty() {
        format!("No matching skills found for: {}", skills.join(", "))
    } else {
        format!("Removed {}", removed.join(", "))
    };

    Ok(SkillRemoveResult { removed, message })
}

pub fn remove_all_skills_in(scope: &Scope) -> Result<SkillRemoveResult, String> {
    let names: Vec<String> = scan_skills(scope).into_iter().map(|s| s.name).collect();
    let targets = install::targets(scope)?;
    let removed = remove_named(&targets, &names);
    lock::clear_lock_skills(scope);

    Ok(SkillRemoveResult {
        removed,
        message: "Removed every skill".into(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "curie-remove-{tag}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

    fn write_skill(dir: &Path, name: &str) {
        fs::create_dir_all(dir).expect("skill dir");
        fs::write(
            dir.join("SKILL.md"),
            format!("---\nname: {name}\ndescription: {name} skill\n---\n"),
        )
        .expect("skill file");
    }

    #[test]
    fn removes_the_canonical_copy_and_every_link() {
        let project = temp_dir("project");
        fs::create_dir_all(project.join(".claude")).expect("agent");
        write_skill(&project.join(".claude/skills/alpha"), "alpha");
        write_skill(&project.join(".agents/skills/alpha"), "alpha");

        let result =
            remove_skills_in(&Scope::Project(project.clone()), &["alpha".into()]).expect("remove");

        assert_eq!(result.removed, vec!["alpha"]);
        assert!(!project.join(".agents/skills/alpha").exists());
        assert!(!project.join(".claude/skills/alpha").exists());

        let _ = fs::remove_dir_all(&project);
    }

    #[test]
    fn reports_names_that_are_not_installed() {
        let project = temp_dir("missing");
        let result =
            remove_skills_in(&Scope::Project(project.clone()), &["nope".into()]).expect("remove");

        assert!(result.removed.is_empty());
        assert!(result.message.contains("No matching skills"));

        let _ = fs::remove_dir_all(&project);
    }

    #[test]
    fn rejects_invalid_names() {
        assert!(remove_skills_in(&Scope::Global, &["a/b".into()]).is_err());
        assert!(remove_skills_in(&Scope::Global, &["..".into()]).is_err());
        assert!(remove_skills_in(&Scope::Global, &["-flag".into()]).is_err());
        assert!(remove_skills_in(&Scope::Global, &[]).is_err());
    }

    #[test]
    fn removes_a_skill_whose_folder_differs_from_its_name() {
        let project = temp_dir("renamed");
        write_skill(&project.join(".agents/skills/cool-skill"), "Cool Skill");

        let result = remove_skills_in(&Scope::Project(project.clone()), &["Cool Skill".into()])
            .expect("remove");

        assert_eq!(result.removed, vec!["Cool Skill"]);
        assert!(!project.join(".agents/skills/cool-skill").exists());

        let _ = fs::remove_dir_all(&project);
    }
}
