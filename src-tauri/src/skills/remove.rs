use super::npx::run_skills_command;
use super::types::SkillRemoveResult;

/// Remove one or more global skills via `npx skills remove -g -y [skills…]`.
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

    let output = run_skills_command(&args)?;
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
    } else {
        format!("Removed {}", skills.join(", "))
    };

    Ok(SkillRemoveResult {
        removed: skills.to_vec(),
        message,
    })
}
