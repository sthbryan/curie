use serde::Serialize;

use crate::errors::{coded, key};

use super::scope::Scope;
use super::source::{acquire, discover_skills, parse_source};

const MAX_RETURNED: usize = 50;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DetectedSkill {
    pub name: String,
    pub description: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SkillDetection {
    pub is_skill: bool,
    pub total: u32,
    pub truncated: bool,
    pub skills: Vec<DetectedSkill>,
    pub ref_used: Option<String>,
}

pub fn detect_skill_in(_scope: &Scope, package: &str) -> Result<SkillDetection, String> {
    let package = package.trim();
    if package.is_empty() {
        return Err(coded(key::PACKAGE_REQUIRED));
    }
    if package.starts_with('-') || package.contains(char::is_whitespace) {
        return Err(coded(key::PACKAGE_INVALID));
    }

    let source = parse_source(package)?;
    let workspace = acquire(&source)?;
    let filter = source
        .skill_filter()
        .map(|name| name.trim().to_lowercase())
        .filter(|name| !name.is_empty());

    let discovered: Vec<_> = discover_skills(&workspace.root, source.subpath())?
        .into_iter()
        .filter(|skill| !skill.internal)
        .filter(|skill| {
            filter
                .as_deref()
                .map(|wanted| skill.name.to_lowercase() == wanted)
                .unwrap_or(true)
        })
        .collect();

    let total = discovered.len() as u32;
    let truncated = discovered.len() > MAX_RETURNED;
    let skills: Vec<DetectedSkill> = discovered
        .into_iter()
        .take(MAX_RETURNED)
        .map(|skill| DetectedSkill {
            name: skill.name,
            description: skill.description,
        })
        .collect();

    Ok(SkillDetection {
        is_skill: !skills.is_empty(),
        total,
        truncated,
        skills,
        ref_used: source.ref_name().map(str::to_string),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "curie-detect-{tag}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

    fn write_skill(root: &std::path::Path, relative: &str, name: &str, description: &str) {
        let dir = root.join(relative);
        fs::create_dir_all(&dir).expect("skill dir");
        fs::write(
            dir.join("SKILL.md"),
            format!("---\nname: {name}\ndescription: {description}\n---\n"),
        )
        .expect("skill file");
    }

    #[test]
    fn lists_the_skills_in_a_local_package() {
        let root = temp_dir("package");
        write_skill(&root, "skills/alpha", "alpha", "First skill");
        write_skill(&root, "skills/beta", "beta", "Second skill");

        let detection = detect_skill_in(&Scope::Global, root.to_str().unwrap()).expect("detect");

        assert!(detection.is_skill);
        assert_eq!(detection.total, 2);
        assert!(!detection.truncated);
        let names: Vec<&str> = detection.skills.iter().map(|s| s.name.as_str()).collect();
        assert_eq!(names, vec!["alpha", "beta"]);

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_package_without_skills_reports_empty() {
        let root = temp_dir("empty");
        fs::write(root.join("README.md"), "nothing").expect("readme");

        let detection = detect_skill_in(&Scope::Global, root.to_str().unwrap()).expect("detect");

        assert!(!detection.is_skill);
        assert_eq!(detection.total, 0);
        assert!(detection.skills.is_empty());

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn truncates_long_packages() {
        let root = temp_dir("many");
        for index in 0..(MAX_RETURNED + 5) {
            write_skill(
                &root,
                &format!("skills/skill-{index:03}"),
                &format!("skill-{index:03}"),
                "Many",
            );
        }

        let detection = detect_skill_in(&Scope::Global, root.to_str().unwrap()).expect("detect");

        assert_eq!(detection.total as usize, MAX_RETURNED + 5);
        assert!(detection.truncated);
        assert_eq!(detection.skills.len(), MAX_RETURNED);

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn rejects_empty_packages() {
        assert!(detect_skill_in(&Scope::Global, "").is_err());
        assert!(detect_skill_in(&Scope::Global, "--list").is_err());
    }
}
