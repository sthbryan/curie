mod node;
mod skills;
mod update;

pub use node::{detect_node_info, install_node_impl, NodeInfo};
pub use skills::{
    check_global_skill_updates, list_global_skills, CustomSkillSaveResult, ExplorePage,
    SkillExploreResult, SkillInfo, SkillInstallResult, SkillRemoveResult, SkillSearchResult,
    SkillUpdateInfo, SkillUpdateResult,
};
pub use update::{AppUpdateInfo, InstallResult};

#[tauri::command]
fn get_locale() -> String {
    sys_locale::get_locale().unwrap_or_else(|| "en-US".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_locale,
            node::detect_node,
            node::install_node,
            skills::list_skills,
            skills::check_skill_updates,
            skills::update_skills,
            skills::find_skills,
            skills::explore_skills,
            skills::add_skill,
            skills::remove_skills,
            skills::save_custom_skill,
            update::check_app_update,
            update::install_app_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
