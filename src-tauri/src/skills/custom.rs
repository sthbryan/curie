use super::npx::run_skills_command;
use super::types::CustomSkillInstallResult;
use std::fs;
use std::path::{Path, PathBuf};

const CUSTOM_DIR: &str = ".curie/custom-skills";

pub fn install_custom_skill(
    name: &str,
    content: &str,
) -> Result<CustomSkillInstallResult, String> {
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
    let file = base.join("SKILL.md");

    let existed = base.exists();
    let previous = fs::read(&file).ok();

    fs::create_dir_all(&base).map_err(|e| format!("could not create {}: {e}", base.display()))?;
    fs::write(&file, content).map_err(|e| format!("could not write {}: {e}", file.display()))?;

    let base_string = base.to_string_lossy().to_string();
    let outcome = run_skills_command(&["add", &base_string, "-g", "-y"]);

    let failure = match outcome {
        Ok(output) if output.status.success() => None,
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Some(if !stderr.is_empty() {
                stderr
            } else if !stdout.is_empty() {
                stdout
            } else {
                format!("skills add exited with status {}", output.status)
            })
        }
        Err(e) => Some(e),
    };

    if let Some(reason) = failure {
        roll_back(existed, previous.as_deref(), &base, &file);
        return Err(reason);
    }

    Ok(CustomSkillInstallResult {
        name: name.to_string(),
        path: file.to_string_lossy().to_string(),
        message: format!("Installed custom skill from {base_string}"),
    })
}

fn roll_back(existed: bool, previous: Option<&[u8]>, base: &Path, file: &Path) {
    match previous {
        Some(bytes) => {
            let _ = fs::write(file, bytes);
        }
        None => {
            let _ = fs::remove_file(file);
            if !existed {
                let _ = fs::remove_dir_all(base);
            }
        }
    }
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
        assert!(install_custom_skill("", "body").is_err());
        assert!(install_custom_skill("   ", "body").is_err());
    }

    #[test]
    fn rejects_empty_content() {
        assert!(install_custom_skill("my-skill", "   \n  ").is_err());
    }

    #[test]
    fn rejects_invalid_name() {
        assert!(install_custom_skill("../bad", "x").is_err());
        assert!(install_custom_skill("with space", "x").is_err());
        assert!(install_custom_skill("slash/here", "x").is_err());
        assert!(install_custom_skill("-leading", "x").is_err());
        assert!(install_custom_skill(".hidden", "x").is_err());
    }

    #[test]
    fn accepts_typical_name() {
        assert!(is_valid_skill_name("my-skill"));
        assert!(is_valid_skill_name("skill.v2"));
        assert!(is_valid_skill_name("Cool_Skill"));
    }

    #[test]
    fn roll_back_restores_previous_content() {
        let dir = std::env::temp_dir().join(format!("curie-rb-{}", std::process::id()));
        let file = dir.join("SKILL.md");
        fs::create_dir_all(&dir).unwrap();
        fs::write(&file, b"new").unwrap();

        roll_back(true, Some(b"old"), &dir, &file);

        assert_eq!(fs::read(&file).unwrap(), b"old");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn roll_back_removes_a_directory_it_created() {
        let dir = std::env::temp_dir().join(format!("curie-rb-new-{}", std::process::id()));
        let file = dir.join("SKILL.md");
        fs::create_dir_all(&dir).unwrap();
        fs::write(&file, b"new").unwrap();

        roll_back(false, None, &dir, &file);

        assert!(!dir.exists());
    }

    #[test]
    fn roll_back_keeps_a_directory_that_already_existed() {
        let dir = std::env::temp_dir().join(format!("curie-rb-keep-{}", std::process::id()));
        let file = dir.join("SKILL.md");
        fs::create_dir_all(&dir).unwrap();
        fs::write(&file, b"new").unwrap();

        roll_back(true, None, &dir, &file);

        assert!(dir.exists());
        assert!(!file.exists());
        let _ = fs::remove_dir_all(&dir);
    }
}
