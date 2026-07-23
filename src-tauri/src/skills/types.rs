use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillInfo {
    pub name: String,
    pub path: String,
    pub scope: String,
    pub agents: Vec<String>,
    pub source: Option<String>,
    pub source_url: Option<String>,
    pub source_type: Option<String>,
    pub installed_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillUpdateInfo {
    pub name: String,
    pub source: Option<String>,
    pub update_available: bool,
    pub checkable: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillUpdateResult {
    pub updated: Vec<String>,
    pub message: String,
}

#[derive(Deserialize)]
pub(crate) struct CliSkill {
    pub name: String,
    pub path: String,
    pub scope: String,
    #[serde(default)]
    pub agents: Vec<String>,
    pub source: Option<String>,
    #[serde(rename = "sourceUrl")]
    pub source_url: Option<String>,
    #[serde(rename = "sourceType")]
    pub source_type: Option<String>,
}

#[derive(Deserialize, Default)]
pub(crate) struct SkillLockFile {
    #[serde(default)]
    pub skills: HashMap<String, SkillLockEntry>,
}

#[derive(Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SkillLockEntry {
    pub source: Option<String>,
    pub source_type: Option<String>,
    pub source_url: Option<String>,
    pub skill_path: Option<String>,
    pub skill_folder_hash: Option<String>,
    pub installed_at: Option<String>,
    pub updated_at: Option<String>,
    #[serde(default)]
    pub r#ref: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct GitTreeResponse {
    pub sha: String,
    #[serde(default)]
    pub tree: Vec<GitTreeEntry>,
}

#[derive(Deserialize)]
pub(crate) struct GitTreeEntry {
    pub path: String,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub sha: String,
}
