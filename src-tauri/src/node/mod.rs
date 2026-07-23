mod detect;
mod install;

pub use detect::{detect_node_info, NodeInfo};
pub use install::install_node_impl;

use tauri::{Emitter, Window};

#[derive(serde::Serialize, Clone)]
struct ProgressEvent {
    stage: String,
    message: String,
    done: bool,
}

#[tauri::command]
pub async fn install_node(window: Window) -> Result<(), String> {
    install_node_impl(|stage, message, done| {
        emit_progress(&window, stage, message, done);
    })
}

#[tauri::command]
pub fn detect_node() -> Result<NodeInfo, String> {
    detect_node_info()
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
