use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

const SETTINGS_VERSION: u32 = 1;

fn default_theme() -> String {
    "dark".to_string()
}

fn default_lang() -> String {
    "en".to_string()
}

fn default_reduced_motion() -> String {
    "user".to_string()
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    #[serde(default)]
    pub version: u32,
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_lang")]
    pub lang: String,
    #[serde(default = "default_reduced_motion")]
    pub reduced_motion: String,
    #[serde(default)]
    pub has_booted: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            version: 0,
            theme: default_theme(),
            lang: default_lang(),
            reduced_motion: default_reduced_motion(),
            has_booted: false,
        }
    }
}

pub(crate) fn read_settings_file(path: &Path) -> Settings {
    let Ok(raw) = fs::read_to_string(path) else {
        return Settings::default();
    };
    serde_json::from_str::<Settings>(&raw).unwrap_or_default()
}

pub(crate) fn write_settings_file(path: &Path, settings: &Settings) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| format!("invalid settings path: {}", path.display()))?;
    fs::create_dir_all(parent)
        .map_err(|e| format!("could not create {}: {e}", parent.display()))?;

    let stored = Settings {
        version: SETTINGS_VERSION,
        ..settings.clone()
    };
    let body = serde_json::to_string_pretty(&stored)
        .map_err(|e| format!("could not encode the settings: {e}"))?;

    let temp = path.with_extension("json.tmp");
    fs::write(&temp, body).map_err(|e| format!("could not write {}: {e}", temp.display()))?;
    fs::rename(&temp, path).map_err(|e| {
        let _ = fs::remove_file(&temp);
        format!("could not save {}: {e}", path.display())
    })
}

#[tauri::command]
pub async fn read_settings() -> Result<Settings, String> {
    tauri::async_runtime::spawn_blocking(|| Ok(read_settings_file(&crate::paths::settings_file()?)))
        .await
        .map_err(|e| format!("read settings task failed: {e}"))?
}

#[tauri::command]
pub async fn write_settings(settings: Settings) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        write_settings_file(&crate::paths::settings_file()?, &settings)
    })
    .await
    .map_err(|e| format!("write settings task failed: {e}"))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("curie-set-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn sample() -> Settings {
        Settings {
            version: 0,
            theme: "nord".to_string(),
            lang: "es".to_string(),
            reduced_motion: "always".to_string(),
            has_booted: true,
        }
    }

    #[test]
    fn a_missing_file_reads_as_defaults() {
        let dir = temp_dir("missing");
        let settings = read_settings_file(&dir.join("settings.json"));
        assert_eq!(settings, Settings::default());
        assert_eq!(settings.version, 0);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_corrupt_file_reads_as_defaults() {
        let dir = temp_dir("corrupt");
        let file = dir.join("settings.json");
        fs::write(&file, "{ not json").unwrap();
        assert_eq!(read_settings_file(&file), Settings::default());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn partial_json_fills_the_missing_fields() {
        let dir = temp_dir("partial");
        let file = dir.join("settings.json");
        fs::write(&file, r#"{"theme":"nord"}"#).unwrap();

        let settings = read_settings_file(&file);
        assert_eq!(settings.theme, "nord");
        assert_eq!(settings.lang, "en");
        assert_eq!(settings.reduced_motion, "user");
        assert!(!settings.has_booted);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn round_trips_the_settings() {
        let dir = temp_dir("round");
        let file = dir.join("nested").join("settings.json");
        write_settings_file(&file, &sample()).unwrap();

        let stored = read_settings_file(&file);
        assert_eq!(stored.theme, "nord");
        assert_eq!(stored.lang, "es");
        assert_eq!(stored.reduced_motion, "always");
        assert!(stored.has_booted);
        assert!(!file.with_extension("json.tmp").exists());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn write_stamps_the_current_version() {
        let dir = temp_dir("version");
        let file = dir.join("settings.json");
        write_settings_file(&file, &sample()).unwrap();
        assert_eq!(read_settings_file(&file).version, SETTINGS_VERSION);
        let _ = fs::remove_dir_all(&dir);
    }
}
