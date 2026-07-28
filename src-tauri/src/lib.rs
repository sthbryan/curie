mod node;
mod paths;
mod projects;
mod settings;
mod skills;
mod update;

pub use node::{build_plan, detect_node_info, install_node_impl, ManagerInfo, NodeInfo, SetupPlan};
pub use projects::{Project, ProjectProbe};
pub use settings::Settings;
pub use skills::{
    check_skill_updates_in, list_skills_in, CustomSkillInstallResult, DetectedSkill, ExplorePage,
    Scope, SkillDetection, SkillExploreResult, SkillInfo, SkillInstallResult, SkillRemoveResult,
    SkillSearchResult, SkillUpdateInfo, SkillUpdateResult,
};
pub use update::{AppUpdateInfo, InstallResult};

#[tauri::command]
fn get_locale() -> String {
    sys_locale::get_locale().unwrap_or_else(|| "en-US".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_locale,
            node::detect_node,
            node::install_node,
            node::plan_node_setup,
            skills::list_skills,
            skills::check_skill_updates,
            skills::update_skills,
            skills::find_skills,
            skills::explore_skills,
            skills::add_skill,
            skills::detect_skill,
            skills::remove_skills,
            skills::remove_all_skills,
            skills::install_custom_skill,
            skills::read_markdown_file,
            projects::validate_project_path,
            projects::read_projects,
            projects::write_projects,
            settings::read_settings,
            settings::write_settings,
            update::check_app_update,
            update::install_app_update,
            update::restart_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
