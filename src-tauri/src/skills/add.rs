use super::npx::run_skills_command;
use super::types::SkillInstallResult;

pub fn add_global_skill(package: &str) -> Result<SkillInstallResult, String> {
    let package = package.trim();
    if package.is_empty() {
        return Err("package is required".into());
    }
    if package.starts_with('-') || package.contains(char::is_whitespace) {
        return Err("invalid package name".into());
    }

    let output = run_skills_command(&["add", package, "-g", "-y"])?;
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if !output.status.success() {
        return Err(if !stderr.is_empty() {
            stderr
        } else if !stdout.is_empty() {
            stdout
        } else {
            "skills add exited non-zero".into()
        });
    }

    let message = if !stdout.is_empty() {
        stdout
    } else if !stderr.is_empty() {
        stderr
    } else {
        format!("Installed {package}")
    };

    Ok(SkillInstallResult {
        package: package.to_string(),
        message,
    })
}
