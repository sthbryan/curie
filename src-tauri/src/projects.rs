use crate::errors::{coded, coded_with, key};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

const REGISTRY_VERSION: u32 = 1;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub added_at: String,
}

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct Registry {
    #[serde(default)]
    version: u32,
    #[serde(default)]
    projects: Vec<Project>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProjectProbe {
    pub path: String,
    pub name: String,
    pub exists: bool,
    pub is_dir: bool,
    pub is_reserved: bool,
}

pub(crate) fn is_reserved(path: &Path, home: Option<&Path>) -> bool {
    path.parent().is_none() || home.map(|h| h == path).unwrap_or(false)
}

pub(crate) fn project_name(path: &Path) -> String {
    path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .filter(|n| !n.is_empty())
        .unwrap_or_else(|| path.to_string_lossy().to_string())
}

pub(crate) fn read_registry(path: &Path) -> Vec<Project> {
    let Ok(raw) = fs::read_to_string(path) else {
        return Vec::new();
    };
    serde_json::from_str::<Registry>(&raw)
        .map(|r| r.projects)
        .unwrap_or_default()
}

pub(crate) fn write_registry(path: &Path, projects: &[Project]) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| coded_with(key::PATH_INVALID, path.display()))?;
    fs::create_dir_all(parent)
        .map_err(|_| coded_with(key::DIR_CREATE_FAILED, parent.display()))?;

    let registry = Registry {
        version: REGISTRY_VERSION,
        projects: projects.to_vec(),
    };
    let body = serde_json::to_string_pretty(&registry)
        .map_err(|_| coded(key::ENCODE_FAILED))?;

    let temp = path.with_extension("json.tmp");
    fs::write(&temp, body).map_err(|_| coded_with(key::WRITE_FAILED, temp.display()))?;
    fs::rename(&temp, path).map_err(|_| {
        let _ = fs::remove_file(&temp);
        coded_with(key::SAVE_FAILED, path.display())
    })
}

#[tauri::command]
pub async fn validate_project_path(path: String) -> Result<ProjectProbe, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let raw = path.trim();
        if raw.is_empty() {
            return Err(coded(key::PROJECT_PATH_REQUIRED));
        }

        let candidate = Path::new(raw);
        let canonical = fs::canonicalize(candidate).ok();
        let resolved = canonical.clone().unwrap_or_else(|| candidate.to_path_buf());

        Ok(ProjectProbe {
            path: resolved.to_string_lossy().to_string(),
            name: project_name(&resolved),
            exists: canonical.is_some(),
            is_dir: canonical.map(|p| p.is_dir()).unwrap_or(false),
            is_reserved: is_reserved(&resolved, dirs::home_dir().as_deref()),
        })
    })
    .await
    .map_err(|_| coded(key::TASK_FAILED))?
}

#[tauri::command]
pub async fn read_projects() -> Result<Vec<Project>, String> {
    tauri::async_runtime::spawn_blocking(|| Ok(read_registry(&crate::paths::projects_file()?)))
        .await
        .map_err(|_| coded(key::TASK_FAILED))?
}

#[tauri::command]
pub async fn write_projects(projects: Vec<Project>) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        write_registry(&crate::paths::projects_file()?, &projects)
    })
        .await
        .map_err(|_| coded(key::TASK_FAILED))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("curie-reg-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn sample(id: &str) -> Project {
        Project {
            id: id.to_string(),
            name: id.to_string(),
            path: format!("/tmp/{id}"),
            added_at: "2026-07-27T00:00:00.000Z".to_string(),
        }
    }

    #[test]
    fn names_a_project_after_its_folder() {
        assert_eq!(project_name(Path::new("/a/b/don_camaron")), "don_camaron");
        assert_eq!(project_name(Path::new("/a/b/don_camaron/")), "don_camaron");
    }

    #[test]
    fn falls_back_to_the_whole_path_at_the_root() {
        assert_eq!(project_name(Path::new("/")), "/");
    }

    #[test]
    fn reserves_the_root_and_the_home_directory() {
        let home = Path::new("/Users/someone");
        assert!(is_reserved(Path::new("/"), Some(home)));
        assert!(is_reserved(home, Some(home)));
        assert!(!is_reserved(Path::new("/Users/someone/code"), Some(home)));
        assert!(!is_reserved(Path::new("/code/don_camaron"), Some(home)));
    }

    #[test]
    fn a_missing_registry_reads_as_empty() {
        let dir = temp_dir("missing");
        assert!(read_registry(&dir.join("projects.json")).is_empty());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_corrupt_registry_reads_as_empty() {
        let dir = temp_dir("corrupt");
        let file = dir.join("projects.json");
        fs::write(&file, b"{ not json").unwrap();
        assert!(read_registry(&file).is_empty());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn round_trips_the_registry() {
        let dir = temp_dir("round");
        let file = dir.join("nested").join("projects.json");
        let projects = vec![sample("don_camaron"), sample("mi_taquito")];

        write_registry(&file, &projects).unwrap();

        assert_eq!(read_registry(&file), projects);
        assert!(!file.with_extension("json.tmp").exists());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn writing_an_empty_registry_clears_it() {
        let dir = temp_dir("clear");
        let file = dir.join("projects.json");

        write_registry(&file, &[sample("gone")]).unwrap();
        write_registry(&file, &[]).unwrap();

        assert!(read_registry(&file).is_empty());
        let _ = fs::remove_dir_all(&dir);
    }
}
