use super::scope::Scope;
use super::types::SkillLockFile;
use std::path::PathBuf;

pub(crate) fn lock_candidates(scope: &Scope) -> Vec<PathBuf> {
    match scope {
        Scope::Project(root) => vec![
            root.join("skills-lock.json"),
            root.join(".agents").join(".skill-lock.json"),
            root.join(".skill-lock.json"),
        ],
        Scope::Global => {
            let Some(home) = dirs::home_dir() else {
                return Vec::new();
            };
            let mut candidates = Vec::new();
            // The CLI moved its global lock to XDG_STATE_HOME when set.
            if let Some(state) = std::env::var_os("XDG_STATE_HOME").filter(|v| !v.is_empty()) {
                candidates.push(PathBuf::from(state).join("skills").join(".skill-lock.json"));
            }
            candidates.extend([
                home.join(".agents").join(".skill-lock.json"),
                home.join(".skill-lock.json"),
                home.join("skills-lock.json"),
            ]);
            candidates
        }
    }
}

pub(crate) fn load_skill_lock(scope: &Scope) -> SkillLockFile {
    for path in lock_candidates(scope) {
        if let Ok(raw) = std::fs::read_to_string(&path) {
            if let Ok(lock) = serde_json::from_str::<SkillLockFile>(&raw) {
                return lock;
            }
        }
    }

    SkillLockFile::default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn project_scope_prefers_the_project_lockfile() {
        let root = PathBuf::from("/tmp/curie-lock-project");
        let candidates = lock_candidates(&Scope::Project(root.clone()));

        assert_eq!(candidates.len(), 3);
        assert_eq!(candidates[0], root.join("skills-lock.json"));
        assert!(candidates.iter().all(|p| p.starts_with(&root)));
    }

    #[test]
    fn global_scope_looks_under_the_home_directory() {
        let home = dirs::home_dir().expect("home");
        let candidates = lock_candidates(&Scope::Global);

        assert!(candidates.len() >= 3);
        assert!(candidates.contains(&home.join(".agents").join(".skill-lock.json")));
        assert!(candidates.contains(&home.join(".skill-lock.json")));
        assert!(candidates.contains(&home.join("skills-lock.json")));
    }

    #[test]
    fn a_missing_lockfile_yields_an_empty_lock() {
        let root = PathBuf::from("/tmp/curie-lock-nowhere");
        assert!(load_skill_lock(&Scope::Project(root)).skills.is_empty());
    }
}
