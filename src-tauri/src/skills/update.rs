use super::npx::run_skills_command;
use super::types::SkillUpdateResult;

pub fn update_global_skills(skills: Option<Vec<String>>) -> Result<SkillUpdateResult, String> {
    let names: Vec<String> = skills.unwrap_or_default();
    let mut args: Vec<&str> = vec!["update", "-g", "-y"];
    let name_refs: Vec<&str> = names.iter().map(String::as_str).collect();
    args.extend(name_refs.iter().copied());

    let output = run_skills_command(&args)?;
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if !output.status.success() {
        return Err(if !stderr.is_empty() {
            stderr
        } else if !stdout.is_empty() {
            stdout
        } else {
            "skills update exited non-zero".into()
        });
    }

    let message = if !stdout.is_empty() {
        stdout
    } else if !stderr.is_empty() {
        stderr
    } else if names.is_empty() {
        "Updated global skills".into()
    } else {
        format!("Updated {}", names.join(", "))
    };

    Ok(SkillUpdateResult {
        updated: names,
        message,
    })
}
