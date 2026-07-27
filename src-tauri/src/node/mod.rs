mod detect;
mod install;
mod manager;

pub use detect::{detect_node_info, NodeInfo};
pub use install::{build_plan, install_node_impl, SetupPlan};
pub use manager::ManagerInfo;

use tauri::{Emitter, Window};

#[derive(serde::Serialize, Clone)]
struct ProgressEvent {
    stage: String,
    message: String,
    done: bool,
}

#[tauri::command]
pub async fn install_node(window: Window) -> Result<NodeInfo, String> {
    tauri::async_runtime::spawn_blocking(move || {
        install_node_impl(|stage, message, done| {
            emit_progress(&window, stage, message, done);
        })
    })
    .await
    .map_err(|e| format!("node install task failed: {e}"))?
}

#[tauri::command]
pub async fn detect_node() -> Result<NodeInfo, String> {
    tauri::async_runtime::spawn_blocking(detect_node_info)
        .await
        .map_err(|e| format!("node detection task failed: {e}"))?
}

#[tauri::command]
pub async fn plan_node_setup() -> Result<SetupPlan, String> {
    tauri::async_runtime::spawn_blocking(build_plan)
        .await
        .map_err(|e| format!("node planning task failed: {e}"))?
}

fn emit_progress(window: &Window, stage: &str, message: &str, done: bool) {
    let _ = window.emit(
        "setup-progress",
        ProgressEvent {
            stage: stage.into(),
            message: message.into(),
            done,
        },
    );
}
