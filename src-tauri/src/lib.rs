mod node;
mod skills;

pub use node::{detect_node_info, install_node_impl, NodeInfo};
pub use skills::{
    check_global_skill_updates, list_global_skills, SkillInfo, SkillInstallResult,
    SkillRemoveResult, SkillSearchResult, SkillUpdateInfo, SkillUpdateResult,
};

#[tauri::command]
fn get_locale() -> String {
    sys_locale::get_locale().unwrap_or_else(|| "en-US".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_locale,
            node::detect_node,
            node::install_node,
            skills::list_skills,
            skills::check_skill_updates,
            skills::update_skills,
            skills::find_skills,
            skills::add_skill,
            skills::remove_skills,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
