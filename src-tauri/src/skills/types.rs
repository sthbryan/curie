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

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SkillSearchResult {
    pub id: String,
    pub name: String,
    pub source: String,
    pub installs: u64,
    pub package: String,
    pub url: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SkillExploreResult {
    pub id: String,
    pub name: String,
    pub source: String,
    pub installs: u64,
    pub package: String,
    pub url: String,
    pub installs_yesterday: Option<u64>,
    pub change: Option<i64>,
    pub is_official: bool,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ExplorePage {
    pub skills: Vec<SkillExploreResult>,
    pub total: u64,
    pub has_more: bool,
    pub page: u32,
    pub view: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillInstallResult {
    pub package: String,
    pub message: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillRemoveResult {
    pub removed: Vec<String>,
    pub message: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CustomSkillSaveResult {
    pub name: String,
    pub path: String,
    pub message: String,
}

#[derive(Deserialize)]
pub(crate) struct SearchApiResponse {
    #[serde(default)]
    pub skills: Vec<SearchApiSkill>,
}

#[derive(Deserialize)]
pub(crate) struct SearchApiSkill {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub source: String,
    #[serde(default)]
    pub installs: u64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ExploreApiResponse {
    #[serde(default)]
    pub skills: Vec<ExploreApiSkill>,
    #[serde(default)]
    pub total: u64,
    #[serde(default)]
    pub has_more: bool,
    pub page: Option<u32>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ExploreApiSkill {
    #[serde(default)]
    pub source: String,
    #[serde(default)]
    pub skill_id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub installs: u64,
    pub installs_yesterday: Option<u64>,
    pub change: Option<i64>,
    pub is_official: Option<bool>,
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
