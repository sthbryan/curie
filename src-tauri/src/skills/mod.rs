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
mod scope;
mod types;
mod update;

pub use add::add_skill_in;
pub use check::check_skill_updates_in;
pub use custom::install_custom_skill_in;
pub use detect::{detect_skill_in, DetectedSkill, SkillDetection};
pub use explore::explore_skills as browse_skills;
pub use find::find_skills as search_skills;
pub use list::list_skills_in;
pub use remove::{remove_all_skills_in, remove_skills_in};
pub use types::{
    CustomSkillInstallResult, ExplorePage, SkillExploreResult, SkillInfo, SkillInstallResult,
    SkillRemoveResult, SkillSearchResult, SkillUpdateInfo, SkillUpdateResult,
};
pub use scope::Scope;
pub use update::update_skills_in;

#[tauri::command]
pub async fn list_skills(project_path: Option<String>) -> Result<Vec<SkillInfo>, String> {
    tauri::async_runtime::spawn_blocking(move || list_skills_in(&Scope::resolve(project_path)?))
        .await
        .map_err(|e| format!("list task failed: {e}"))?
}

#[tauri::command]
pub async fn check_skill_updates(
    project_path: Option<String>,
) -> Result<Vec<SkillUpdateInfo>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        check_skill_updates_in(&Scope::resolve(project_path)?)
    })
    .await
    .map_err(|e| format!("update check task failed: {e}"))?
}

#[tauri::command]
pub async fn update_skills(
    skills: Option<Vec<String>>,
    project_path: Option<String>,
) -> Result<SkillUpdateResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        update_skills_in(&Scope::resolve(project_path)?, skills)
    })
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
    project_path: Option<String>,
) -> Result<SkillInstallResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        add_skill_in(
            &Scope::resolve(project_path)?,
            &package,
            skill_name.as_deref(),
        )
    })
    .await
    .map_err(|e| format!("add task failed: {e}"))?
}

#[tauri::command]
pub async fn detect_skill(
    package: String,
    project_path: Option<String>,
) -> Result<SkillDetection, String> {
    tauri::async_runtime::spawn_blocking(move || {
        detect_skill_in(&Scope::resolve(project_path)?, &package)
    })
    .await
    .map_err(|e| format!("detect task failed: {e}"))?
}

#[tauri::command]
pub async fn remove_skills(
    skills: Vec<String>,
    project_path: Option<String>,
) -> Result<SkillRemoveResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        remove_skills_in(&Scope::resolve(project_path)?, &skills)
    })
    .await
    .map_err(|e| format!("remove task failed: {e}"))?
}

#[tauri::command]
pub async fn remove_all_skills(
    project_path: Option<String>,
) -> Result<SkillRemoveResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        remove_all_skills_in(&Scope::resolve(project_path)?)
    })
    .await
    .map_err(|e| format!("remove task failed: {e}"))?
}

#[tauri::command]
pub async fn install_custom_skill(
    name: String,
    content: String,
    project_path: Option<String>,
) -> Result<CustomSkillInstallResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        install_custom_skill_in(&Scope::resolve(project_path)?, &name, &content)
    })
    .await
    .map_err(|e| format!("install task failed: {e}"))?
}
