use crate::errors::{coded, coded_with, key};
use super::npx::run_skills_command;
use super::scope::Scope;
use super::types::CustomSkillInstallResult;
use std::fs;
use std::path::Path;

pub fn install_custom_skill_in(
    scope: &Scope,
    name: &str,
    content: &str,
) -> Result<CustomSkillInstallResult, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err(coded(key::SKILL_NAME_REQUIRED));
    }
    if !is_valid_skill_name(name) {
        return Err(
            "skill name may only contain letters, digits, dashes, dots, and underscores".into(),
        );
    }
    if content.trim().is_empty() {
        return Err(coded(key::SKILL_CONTENT_EMPTY));
    }

    let base = crate::paths::custom_skills_dir()?.join(name);
    let file = base.join("SKILL.md");

    let existed = base.exists();
    let previous = fs::read(&file).ok();

    fs::create_dir_all(&base).map_err(|_| coded_with(key::DIR_CREATE_FAILED, base.display()))?;
    fs::write(&file, content).map_err(|_| coded_with(key::WRITE_FAILED, file.display()))?;

    let base_string = base.to_string_lossy().to_string();
    let mut args: Vec<&str> = vec!["add", &base_string];
    if let Some(flag) = scope.flag() {
        args.push(flag);
    }
    args.push("-y");
    let outcome = run_skills_command(&args, scope);

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
                coded_with(key::SKILL_ADD_FAILED, output.status)
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

const MAX_MARKDOWN_BYTES: u64 = 512 * 1024;

pub fn read_markdown_in(path: &Path) -> Result<String, String> {
    let is_markdown = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("md") || e.eq_ignore_ascii_case("markdown"))
        .unwrap_or(false);
    if !is_markdown {
        return Err(coded_with(key::NOT_MARKDOWN, path.display()));
    }

    let meta =
        fs::metadata(path).map_err(|_| coded_with(key::READ_FAILED, path.display()))?;
    if !meta.is_file() {
        return Err(coded_with(key::NOT_A_FILE, path.display()));
    }
    if meta.len() > MAX_MARKDOWN_BYTES {
        return Err(coded_with(key::FILE_TOO_LARGE, path.display()));
    }

    fs::read_to_string(path).map_err(|_| coded_with(key::READ_FAILED, path.display()))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(tag: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("curie-md-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn reads_a_markdown_file() {
        let dir = temp_dir("read");
        let file = dir.join("SKILL.md");
        fs::write(&file, "---\nname: x\n---\nbody").unwrap();

        assert_eq!(read_markdown_in(&file).unwrap(), "---\nname: x\n---\nbody");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn accepts_the_markdown_extension_in_any_case() {
        let dir = temp_dir("case");
        let file = dir.join("SKILL.MARKDOWN");
        fs::write(&file, "body").unwrap();

        assert_eq!(read_markdown_in(&file).unwrap(), "body");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_a_file_that_is_not_markdown() {
        let dir = temp_dir("ext");
        let file = dir.join("skill.txt");
        fs::write(&file, "body").unwrap();

        assert!(read_markdown_in(&file).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_a_directory() {
        let dir = temp_dir("dir");
        let nested = dir.join("bundle.md");
        fs::create_dir_all(&nested).unwrap();

        assert!(read_markdown_in(&nested).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_a_missing_file() {
        let dir = temp_dir("missing");
        assert!(read_markdown_in(&dir.join("nope.md")).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_a_file_over_the_size_limit() {
        let dir = temp_dir("big");
        let file = dir.join("huge.md");
        fs::write(&file, vec![b'x'; (MAX_MARKDOWN_BYTES + 1) as usize]).unwrap();

        assert!(read_markdown_in(&file).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_empty_name() {
        assert!(install_custom_skill_in(&Scope::Global, "", "body").is_err());
        assert!(install_custom_skill_in(&Scope::Global, "   ", "body").is_err());
    }

    #[test]
    fn rejects_empty_content() {
        assert!(install_custom_skill_in(&Scope::Global, "my-skill", "   \n  ").is_err());
    }

    #[test]
    fn rejects_invalid_name() {
        assert!(install_custom_skill_in(&Scope::Global, "../bad", "x").is_err());
        assert!(install_custom_skill_in(&Scope::Global, "with space", "x").is_err());
        assert!(install_custom_skill_in(&Scope::Global, "slash/here", "x").is_err());
        assert!(install_custom_skill_in(&Scope::Global, "-leading", "x").is_err());
        assert!(install_custom_skill_in(&Scope::Global, ".hidden", "x").is_err());
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
