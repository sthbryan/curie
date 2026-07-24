use super::npx::run_skills_command;
use super::types::CustomSkillSaveResult;
use std::fs;
use std::path::{Path, PathBuf};

const CUSTOM_DIR: &str = ".curie/custom-skills";

pub fn write_custom_skill(name: &str, content: &str) -> Result<CustomSkillSaveResult, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("skill name is required".into());
    }
    if !is_valid_skill_name(name) {
        return Err(
            "skill name may only contain letters, digits, dashes, dots, and underscores".into(),
        );
    }
    if content.trim().is_empty() {
        return Err("skill content is empty".into());
    }

    let home = dirs::home_dir().ok_or_else(|| "could not resolve home directory".to_string())?;
    let base: PathBuf = [home.as_path(), Path::new(CUSTOM_DIR), Path::new(name)]
        .iter()
        .collect();
    fs::create_dir_all(&base).map_err(|e| format!("could not create {}: {e}", base.display()))?;

    let file = base.join("SKILL.md");
    fs::write(&file, content).map_err(|e| format!("could not write {}: {e}", file.display()))?;

    let path_string = file.to_string_lossy().to_string();
    let base_string = base.to_string_lossy().to_string();

    let (installed, install_message) = match run_skills_command(&["add", &base_string, "-g", "-y"])
    {
        Ok(output) => {
            if output.status.success() {
                (true, None)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
                let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
                let detail = if !stderr.is_empty() {
                    stderr
                } else if !stdout.is_empty() {
                    stdout
                } else {
                    format!("skills add exited with status {}", output.status)
                };
                (false, Some(detail))
            }
        }
        Err(e) => (false, Some(e)),
    };

    Ok(CustomSkillSaveResult {
        name: name.to_string(),
        path: path_string,
        message: format!("Saved custom skill to {base_string}"),
        installed,
        install_message,
    })
}

fn is_valid_skill_name(name: &str) -> bool {
    if name.len() > 64 {
        return false;
    }
    let bytes = name.as_bytes();
    if bytes[0] == b'.' || bytes[0] == b'-' || bytes[0] == b'_' {
        return false;
    }
    bytes
        .iter()
        .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.'))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_empty_name() {
        assert!(write_custom_skill("", "body").is_err());
        assert!(write_custom_skill("   ", "body").is_err());
    }

    #[test]
    fn rejects_empty_content() {
        assert!(write_custom_skill("my-skill", "   \n  ").is_err());
    }

    #[test]
    fn rejects_invalid_name() {
        assert!(write_custom_skill("../bad", "x").is_err());
        assert!(write_custom_skill("with space", "x").is_err());
        assert!(write_custom_skill("slash/here", "x").is_err());
        assert!(write_custom_skill("-leading", "x").is_err());
        assert!(write_custom_skill(".hidden", "x").is_err());
    }

    #[test]
    fn accepts_typical_name() {
        assert!(is_valid_skill_name("my-skill"));
        assert!(is_valid_skill_name("skill.v2"));
        assert!(is_valid_skill_name("Cool_Skill"));
    }
}
