use super::npx::run_skills_command;
use super::scope::Scope;
use super::types::SkillInstallResult;

pub fn add_skill_in(
    scope: &Scope,
    package: &str,
    skill_name: Option<&str>,
) -> Result<SkillInstallResult, String> {
    let package = package.trim();
    if package.is_empty() {
        return Err("package is required".into());
    }
    if package.starts_with('-') || package.contains(char::is_whitespace) {
        return Err("invalid package name".into());
    }

    let mut args: Vec<&str> = vec!["add", package];
    if let Some(flag) = scope.flag() {
        args.push(flag);
    }
    args.push("-y");
    if let Some(name) = skill_name.map(str::trim).filter(|n| !n.is_empty()) {
        args.push("-s");
        args.push(name);
    }

    let output = run_skills_command(&args, scope)?;
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
