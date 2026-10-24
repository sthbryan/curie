mod errors;
mod node;
mod paths;
mod projects;
mod settings;
mod skills;
mod update;

use std::time::Duration;
use tauri::Manager;

/// The window starts hidden so its first frame is the app, not an empty plate.
/// The frontend reveals it once the shell has painted; this is the backstop for
/// a frontend that never gets that far.
const REVEAL_FALLBACK: Duration = Duration::from_secs(3);

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

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn reveal_main_window(app: tauri::AppHandle, after: Duration) {
    std::thread::spawn(move || {
        std::thread::sleep(after);
        if let Some(window) = app.get_webview_window("main") {
            if !window.is_visible().unwrap_or(true) {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            reveal_main_window(app.handle().clone(), REVEAL_FALLBACK);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_locale,
            show_main_window,
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
