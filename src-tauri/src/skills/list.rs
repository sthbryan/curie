use super::lock::load_skill_lock;
use super::npx::{extract_json_array, run_skills_command};
use super::types::{CliSkill, SkillInfo};

pub fn list_global_skills() -> Result<Vec<SkillInfo>, String> {
    let cli_skills = run_skills_list_global()?;
    let lock = load_skill_lock();

    Ok(cli_skills
        .into_iter()
        .map(|s| {
            let meta = lock.skills.get(&s.name);
            SkillInfo {
                name: s.name,
                path: s.path,
                scope: s.scope,
                agents: s.agents,
                source: s.source,
                source_url: s.source_url,
                source_type: s.source_type,
                installed_at: meta.and_then(|m| m.installed_at.clone()),
                updated_at: meta.and_then(|m| m.updated_at.clone()),
            }
        })
        .collect())
}

fn run_skills_list_global() -> Result<Vec<CliSkill>, String> {
    let output = run_skills_command(&["list", "-g", "--json"])?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        return Err(if !stderr.is_empty() {
            stderr
        } else if !stdout.is_empty() {
            stdout
        } else {
            "skills list exited non-zero".into()
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let json = extract_json_array(&stdout).ok_or_else(|| "skills list did not return JSON".to_string())?;

    serde_json::from_str(json).map_err(|e| format!("Failed to parse skills list JSON: {e}"))
}
