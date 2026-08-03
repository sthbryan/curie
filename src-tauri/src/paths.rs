use crate::errors::{coded, key};
use std::path::PathBuf;

const CURIE_DIR: &str = ".curie";
const PROJECTS_FILE: &str = "projects.json";
const SETTINGS_FILE: &str = "settings.json";
const CUSTOM_SKILLS_DIR: &str = "custom-skills";

pub(crate) fn curie_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| coded(key::HOME_MISSING))?;
    Ok(home.join(CURIE_DIR))
}

pub(crate) fn projects_file() -> Result<PathBuf, String> {
    Ok(curie_dir()?.join(PROJECTS_FILE))
}

pub(crate) fn settings_file() -> Result<PathBuf, String> {
    Ok(curie_dir()?.join(SETTINGS_FILE))
}

pub(crate) fn custom_skills_dir() -> Result<PathBuf, String> {
    Ok(curie_dir()?.join(CUSTOM_SKILLS_DIR))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn curie_dir_sits_directly_under_home() {
        let dir = curie_dir().unwrap();
        assert_eq!(dir.file_name().unwrap(), CURIE_DIR);
        assert_eq!(dir.parent().unwrap(), dirs::home_dir().unwrap());
    }

    #[test]
    fn every_path_hangs_off_the_curie_dir() {
        let base = curie_dir().unwrap();
        assert_eq!(projects_file().unwrap(), base.join(PROJECTS_FILE));
        assert_eq!(settings_file().unwrap(), base.join(SETTINGS_FILE));
        assert_eq!(custom_skills_dir().unwrap(), base.join(CUSTOM_SKILLS_DIR));
    }

    #[test]
    fn custom_skills_dir_is_a_single_component_below_curie() {
        let dir = custom_skills_dir().unwrap();
        let rest = dir.strip_prefix(curie_dir().unwrap()).unwrap();
        assert_eq!(rest, Path::new(CUSTOM_SKILLS_DIR));
        assert_eq!(rest.components().count(), 1);
    }
}
