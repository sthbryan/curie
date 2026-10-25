use super::scope::Scope;
use super::types::SkillLockFile;
use crate::errors::{coded, key};
use serde_json::{json, Map, Value};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

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

/// The file the CLI itself writes for this scope.
fn lock_path(scope: &Scope) -> Option<PathBuf> {
    match scope {
        Scope::Project(root) => Some(root.join("skills-lock.json")),
        Scope::Global => {
            let home = dirs::home_dir()?;
            if let Some(state) = std::env::var_os("XDG_STATE_HOME").filter(|v| !v.is_empty()) {
                return Some(PathBuf::from(state).join("skills").join(".skill-lock.json"));
            }
            Some(home.join(".agents").join(".skill-lock.json"))
        }
    }
}

fn read_document(path: &PathBuf) -> Map<String, Value> {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str::<Value>(&raw).ok())
        .and_then(|value| value.as_object().cloned())
        .unwrap_or_default()
}

fn write_document(path: &PathBuf, document: Map<String, Value>) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|_| crate::errors::coded_with(key::DIR_CREATE_FAILED, parent.display()))?;
    }
    let body = serde_json::to_string_pretty(&Value::Object(document))
        .map_err(|_| coded(key::ENCODE_FAILED))?;
    std::fs::write(path, format!("{body}\n"))
        .map_err(|_| crate::errors::coded_with(key::WRITE_FAILED, path.display()))
}

fn skills_object(document: &mut Map<String, Value>) -> &mut Map<String, Value> {
    let skills = document
        .entry("skills".to_string())
        .or_insert_with(|| json!({}));
    if !skills.is_object() {
        *skills = json!({});
    }
    skills.as_object_mut().expect("skills object")
}

/// Adds or replaces one lock entry, preserving everything else in the file.
pub(crate) fn write_lock_entry(scope: &Scope, name: &str, entry: Value) -> Result<(), String> {
    let Some(path) = lock_path(scope) else {
        return Err(coded(key::HOME_MISSING));
    };
    let mut document = read_document(&path);
    if document.get("version").and_then(Value::as_u64).is_none() {
        let version = if matches!(scope, Scope::Global) { 3 } else { 1 };
        document.insert("version".to_string(), json!(version));
    }
    skills_object(&mut document).insert(name.to_string(), entry);
    write_document(&path, document)
}

fn sanitized_eq(a: &str, b: &str) -> bool {
    a == b || super::scan::sanitize_name(a) == super::scan::sanitize_name(b)
}

pub(crate) fn remove_lock_entry(scope: &Scope, name: &str) {
    let Some(path) = lock_path(scope) else {
        return;
    };
    let mut document = read_document(&path);
    let skills = skills_object(&mut document);
    let key = skills.keys().find(|key| sanitized_eq(key, name)).cloned();
    if let Some(key) = key {
        skills.remove(&key);
        let _ = write_document(&path, document);
    }
}

pub(crate) fn clear_lock_skills(scope: &Scope) {
    let Some(path) = lock_path(scope) else {
        return;
    };
    let mut document = read_document(&path);
    document.insert("skills".to_string(), json!({}));
    let _ = write_document(&path, document);
}

/// `2026-10-24T06:24:33.123Z`, the shape the CLI writes.
pub(crate) fn now_iso8601() -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let (days, rem) = (millis / 86_400_000, millis % 86_400_000);
    let (year, month, day) = civil_from_days(days as i64);
    let seconds = rem / 1000;
    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{:03}Z",
        seconds / 3600,
        (seconds / 60) % 60,
        seconds % 60,
        rem % 1000
    )
}

/// Howard Hinnant's days-to-civil conversion, so no date crate is needed.
fn civil_from_days(days: i64) -> (i64, u32, u32) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    (if m <= 2 { y + 1 } else { y }, m, d)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("curie-lock-{tag}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

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

    #[test]
    fn writing_an_entry_preserves_the_rest_of_the_document() {
        let root = temp_dir("write");
        let path = root.join("skills-lock.json");
        std::fs::write(&path, r#"{"version":1,"skills":{},"custom":"kept"}"#).expect("seed");

        write_lock_entry(
            &Scope::Project(root.clone()),
            "alpha",
            json!({"source": "owner/repo"}),
        )
        .expect("write");
        write_lock_entry(
            &Scope::Project(root.clone()),
            "beta",
            json!({"source": "owner/other"}),
        )
        .expect("write");

        let document: Value =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(document["custom"], "kept");
        assert_eq!(document["skills"]["alpha"]["source"], "owner/repo");
        assert_eq!(document["skills"]["beta"]["source"], "owner/other");

        remove_lock_entry(&Scope::Project(root.clone()), "Alpha");
        let document: Value =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert!(document["skills"].get("alpha").is_none());
        assert!(document["skills"].get("beta").is_some());

        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn a_new_document_gets_the_cli_version() {
        let root = temp_dir("version");
        write_lock_entry(
            &Scope::Project(root.clone()),
            "alpha",
            json!({"source": "owner/repo"}),
        )
        .expect("write");

        let document: Value =
            serde_json::from_str(&std::fs::read_to_string(root.join("skills-lock.json")).unwrap())
                .unwrap();
        assert_eq!(document["version"], 1);

        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn clearing_keeps_the_document_shape() {
        let root = temp_dir("clear");
        write_lock_entry(
            &Scope::Project(root.clone()),
            "alpha",
            json!({"source": "owner/repo"}),
        )
        .expect("write");
        clear_lock_skills(&Scope::Project(root.clone()));

        let document: Value =
            serde_json::from_str(&std::fs::read_to_string(root.join("skills-lock.json")).unwrap())
                .unwrap();
        assert_eq!(document["skills"], json!({}));

        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn formats_an_iso_timestamp() {
        let stamp = now_iso8601();
        assert_eq!(stamp.len(), 24);
        assert!(stamp.ends_with('Z'));
        assert_eq!(&stamp[4..5], "-");
    }

    #[test]
    fn converts_days_to_a_civil_date() {
        assert_eq!(civil_from_days(0), (1970, 1, 1));
        assert_eq!(civil_from_days(20_300), (2025, 7, 31));
        assert_eq!(civil_from_days(20_082), (2024, 12, 25));
    }
}
