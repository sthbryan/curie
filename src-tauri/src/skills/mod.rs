mod check;
mod list;
mod lock;
mod npx;
mod types;
mod update;

pub use check::check_global_skill_updates;
pub use list::list_global_skills;
pub use types::{SkillInfo, SkillUpdateInfo, SkillUpdateResult};
pub use update::update_global_skills;

#[tauri::command]
pub fn list_skills() -> Result<Vec<SkillInfo>, String> {
    list_global_skills()
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
