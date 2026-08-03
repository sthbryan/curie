use crate::errors::{coded_with, key};
use std::path::{Path, PathBuf};

pub enum Scope {
    Global,
    Project(PathBuf),
}

impl Scope {
    pub fn resolve(project_path: Option<String>) -> Result<Self, String> {
        let Some(raw) = project_path else {
            return Ok(Scope::Global);
        };
        let raw = raw.trim();
        if raw.is_empty() {
            return Ok(Scope::Global);
        }
        if raw.starts_with('-') {
            return Err(coded_with(key::PROJECT_PATH_INVALID, raw));
        }
        let candidate = Path::new(raw);
        if !candidate.is_absolute() {
            return Err(coded_with(key::PROJECT_PATH_NOT_ABSOLUTE, raw));
        }
        let canonical = std::fs::canonicalize(candidate)
            .map_err(|_| coded_with(key::PROJECT_FOLDER_MISSING, raw))?;
        if !canonical.is_dir() {
            return Err(coded_with(key::PROJECT_NOT_A_FOLDER, raw));
        }
        Ok(Scope::Project(canonical))
    }

    pub fn cwd(&self) -> Option<&Path> {
        match self {
            Scope::Global => None,
            Scope::Project(path) => Some(path.as_path()),
        }
    }

    pub fn flag(&self) -> Option<&'static str> {
        match self {
            Scope::Global => Some("-g"),
            Scope::Project(_) => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("curie-scope-{tag}-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn none_resolves_to_global() {
        let scope = Scope::resolve(None).unwrap();
        assert!(scope.cwd().is_none());
        assert_eq!(scope.flag(), Some("-g"));
    }

    #[test]
    fn blank_resolves_to_global() {
        assert!(Scope::resolve(Some("   ".into())).unwrap().cwd().is_none());
    }

    #[test]
    fn project_drops_the_global_flag() {
        let dir = temp_dir("flag");
        let scope = Scope::resolve(Some(dir.to_string_lossy().into())).unwrap();
        assert_eq!(scope.flag(), None);
        assert!(scope.cwd().is_some());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_a_relative_path() {
        assert!(Scope::resolve(Some("./somewhere".into())).is_err());
    }

    #[test]
    fn rejects_a_flag_shaped_path() {
        assert!(Scope::resolve(Some("--force".into())).is_err());
    }

    #[test]
    fn rejects_a_missing_folder() {
        let missing = std::env::temp_dir().join("curie-scope-does-not-exist");
        assert!(Scope::resolve(Some(missing.to_string_lossy().into())).is_err());
    }

    #[test]
    fn rejects_a_file() {
        let dir = temp_dir("file");
        let file = dir.join("SKILL.md");
        fs::write(&file, b"x").unwrap();
        assert!(Scope::resolve(Some(file.to_string_lossy().into())).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn normalises_parent_segments_to_one_canonical_path() {
        let dir = temp_dir("canon");
        let nested = dir.join("nested");
        fs::create_dir_all(&nested).unwrap();
        let noisy = nested.join("..").join("nested");

        let direct = Scope::resolve(Some(nested.to_string_lossy().into())).unwrap();
        let round_about = Scope::resolve(Some(noisy.to_string_lossy().into())).unwrap();

        assert_eq!(direct.cwd(), round_about.cwd());
        let _ = fs::remove_dir_all(&dir);
    }
}
