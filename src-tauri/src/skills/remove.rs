use std::process::Output;

use super::npx::run_skills_command;
use super::types::SkillRemoveResult;

pub fn remove_global_skills(skills: &[String]) -> Result<SkillRemoveResult, String> {
    if skills.is_empty() {
        return Err("at least one skill name is required".into());
    }

    for name in skills {
        let name = name.trim();
        if name.is_empty() || name.starts_with('-') || name.contains(char::is_whitespace) {
            return Err(format!("invalid skill name: {name}"));
        }
    }

    let mut args: Vec<&str> = vec!["remove", "-g", "-y"];
    let name_refs: Vec<&str> = skills.iter().map(String::as_str).collect();
    args.extend(name_refs.iter().copied());

    finish(run_skills_command(&args)?, skills.to_vec())
}

pub fn remove_all_global_skills() -> Result<SkillRemoveResult, String> {
    finish(
        run_skills_command(&["remove", "--all", "-g", "-y"])?,
        Vec::new(),
    )
}

fn finish(output: Output, removed: Vec<String>) -> Result<SkillRemoveResult, String> {
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if !output.status.success() {
        return Err(if !stderr.is_empty() {
            stderr
        } else if !stdout.is_empty() {
            stdout
        } else {
            "skills remove exited non-zero".into()
        });
    }

    let message = if !stdout.is_empty() {
        stdout
    } else if !stderr.is_empty() {
        stderr
    } else if removed.is_empty() {
        "Removed every global skill".into()
    } else {
        format!("Removed {}", removed.join(", "))
    };

    Ok(SkillRemoveResult { removed, message })
}
