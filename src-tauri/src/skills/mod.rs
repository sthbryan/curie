mod add;
mod check;
mod custom;
mod detect;
mod explore;
mod find;
mod list;
mod lock;
mod npx;
mod remove;
mod types;
mod update;

pub use add::add_global_skill;
pub use check::check_global_skill_updates;
pub use custom::install_custom_skill as install_skill_from_content;
pub use detect::{detect_global_skill, DetectedSkill, SkillDetection};
pub use explore::explore_skills as browse_skills;
pub use find::find_skills as search_skills;
pub use list::list_global_skills;
pub use remove::{remove_all_global_skills, remove_global_skills};
pub use types::{
    CustomSkillInstallResult, ExplorePage, SkillExploreResult, SkillInfo, SkillInstallResult,
    SkillRemoveResult, SkillSearchResult, SkillUpdateInfo, SkillUpdateResult,
};
pub use update::update_global_skills;

#[tauri::command]
pub async fn list_skills() -> Result<Vec<SkillInfo>, String> {
    tauri::async_runtime::spawn_blocking(list_global_skills)
        .await
        .map_err(|e| format!("list task failed: {e}"))?
}

#[tauri::command]
pub async fn check_skill_updates() -> Result<Vec<SkillUpdateInfo>, String> {
    tauri::async_runtime::spawn_blocking(check_global_skill_updates)
        .await
        .map_err(|e| format!("update check task failed: {e}"))?
}

#[tauri::command]
pub async fn update_skills(skills: Option<Vec<String>>) -> Result<SkillUpdateResult, String> {
    tauri::async_runtime::spawn_blocking(move || update_global_skills(skills))
        .await
        .map_err(|e| format!("update task failed: {e}"))?
}

#[tauri::command]
pub async fn find_skills(
    query: String,
    owner: Option<String>,
) -> Result<Vec<SkillSearchResult>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        search_skills(&query, owner.as_deref())
    })
    .await
    .map_err(|e| format!("find task failed: {e}"))?
}

#[tauri::command]
pub async fn explore_skills(view: String, page: Option<u32>) -> Result<ExplorePage, String> {
    let page = page.unwrap_or(0);
    tauri::async_runtime::spawn_blocking(move || browse_skills(&view, page))
        .await
        .map_err(|e| format!("explore task failed: {e}"))?
}

#[tauri::command]
pub async fn add_skill(
    package: String,
    skill_name: Option<String>,
) -> Result<SkillInstallResult, String> {
    tauri::async_runtime::spawn_blocking(move || add_global_skill(&package, skill_name.as_deref()))
        .await
        .map_err(|e| format!("add task failed: {e}"))?
}

#[tauri::command]
pub async fn detect_skill(package: String) -> Result<SkillDetection, String> {
    tauri::async_runtime::spawn_blocking(move || detect_global_skill(&package))
        .await
        .map_err(|e| format!("detect task failed: {e}"))?
}

#[tauri::command]
pub async fn remove_skills(skills: Vec<String>) -> Result<SkillRemoveResult, String> {
    tauri::async_runtime::spawn_blocking(move || remove_global_skills(&skills))
        .await
        .map_err(|e| format!("remove task failed: {e}"))?
}

#[tauri::command]
pub async fn remove_all_skills() -> Result<SkillRemoveResult, String> {
    tauri::async_runtime::spawn_blocking(remove_all_global_skills)
        .await
        .map_err(|e| format!("remove task failed: {e}"))?
}

#[tauri::command]
pub async fn install_custom_skill(
    name: String,
    content: String,
) -> Result<CustomSkillInstallResult, String> {
    tauri::async_runtime::spawn_blocking(move || install_skill_from_content(&name, &content))
        .await
        .map_err(|e| format!("install task failed: {e}"))?
}
