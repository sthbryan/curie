use super::npx::run_skills_command;
use serde::Serialize;

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

pub fn detect_global_skill(package: &str) -> Result<SkillDetection, String> {
    let package = package.trim();
    if package.is_empty() {
        return Err("package is required".into());
    }
    if package.starts_with('-') || package.contains(char::is_whitespace) {
        return Err("invalid package name".into());
    }

    let output = run_skills_command(&["add", package, "-l"])?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = if stdout.len() >= stderr.len() {
        stdout.as_ref()
    } else {
        stderr.as_ref()
    };

    if !output.status.success() {
        let cleaned = strip_ansi(combined);
        let snippet = first_meaningful_line(&cleaned).unwrap_or_else(|| "detection failed".into());
        return Err(snippet);
    }

    Ok(parse_skill_list(&strip_ansi(combined)))
}

pub(crate) fn parse_skill_list(raw: &str) -> SkillDetection {
    let mut total: u32 = 0;
    let mut ref_used: Option<String> = None;
    let mut skills: Vec<DetectedSkill> = Vec::new();
    let mut in_available = false;
    let mut current_name: Option<String> = None;
    let mut current_desc = String::new();

    for line in raw.lines() {
        let trimmed = line.trim_start();
        let trimmed_end = trimmed.trim_end();

        if !in_available {
            if let Some(n) = parse_found_count(trimmed_end) {
                total = n;
            }
            if let Some(r) = parse_source_ref(trimmed_end) {
                ref_used = Some(r);
            }
            if trimmed_end.contains("Available Skills") {
                in_available = true;
            }
            continue;
        }

        if trimmed_end.starts_with('└') {
            push_skill(&mut skills, &mut current_name, &mut current_desc);
            break;
        }

        if let Some(name) = parse_name_line(trimmed_end) {
            push_skill(&mut skills, &mut current_name, &mut current_desc);
            current_name = Some(name);
            current_desc.clear();
            continue;
        }

        if let Some(desc) = parse_desc_line(trimmed_end) {
            if current_name.is_some() {
                if !current_desc.is_empty() {
                    current_desc.push(' ');
                }
                current_desc.push_str(&desc);
            }
        }
    }

    push_skill(&mut skills, &mut current_name, &mut current_desc);

    let detected_total = total.max(skills.len() as u32);
    let truncated = skills.len() > MAX_RETURNED;
    if truncated {
        skills.truncate(MAX_RETURNED);
    }

    SkillDetection {
        is_skill: !skills.is_empty(),
        total: detected_total,
        truncated,
        skills,
        ref_used,
    }
}

fn push_skill(
    out: &mut Vec<DetectedSkill>,
    name: &mut Option<String>,
    desc: &mut String,
) {
    if let Some(n) = name.take() {
        let d = desc.trim().to_string();
        if !n.is_empty() {
            out.push(DetectedSkill {
                name: n,
                description: d,
            });
        }
    }
    desc.clear();
}

fn parse_found_count(line: &str) -> Option<u32> {
    let idx = line.find("Found ")?;
    let rest = &line[idx + 6..];
    let mut digits = String::new();
    for c in rest.chars() {
        if c.is_ascii_digit() {
            digits.push(c);
        } else if !digits.is_empty() {
            break;
        }
    }
    if digits.is_empty() {
        None
    } else {
        digits.parse().ok()
    }
}

fn parse_source_ref(line: &str) -> Option<String> {
    let idx = line.find("Source:")?;
    let rest = line[idx + 7..].trim();
    if let Some(at_idx) = rest.rfind(" @ ") {
        let tail = rest[at_idx + 3..].trim();
        if let Some(space_idx) = tail.find(|c: char| c.is_whitespace() || c == '(') {
            return Some(tail[..space_idx].to_string());
        }
        return Some(tail.to_string());
    }
    None
}

fn parse_name_line(line: &str) -> Option<String> {
    let rest = strip_box(line)?;
    let spaces = leading_spaces(rest);
    if spaces != 4 {
        return None;
    }
    let after = rest[4..].trim();
    if after.is_empty() {
        return None;
    }
    if after.chars().any(|c| c.is_whitespace()) {
        return None;
    }
    if !after
        .chars()
        .all(|c| c.is_alphanumeric() || c == '-' || c == '_' || c == '.' || c == '/' || c == ':')
    {
        return None;
    }
    Some(after.to_string())
}

fn parse_desc_line(line: &str) -> Option<String> {
    let rest = strip_box(line)?;
    let spaces = leading_spaces(rest);
    if spaces < 6 {
        return None;
    }
    let after = rest[spaces..].trim();
    if after.is_empty() {
        return None;
    }
    if after.starts_with('│') || after.starts_with('└') || after.starts_with('├') {
        return None;
    }
    Some(after.to_string())
}

fn strip_box(line: &str) -> Option<&str> {
    if let Some(rest) = line
        .strip_prefix('│')
        .or_else(|| line.strip_prefix('|'))
    {
        Some(rest)
    } else {
        None
    }
}

fn leading_spaces(s: &str) -> usize {
    s.bytes().take_while(|b| *b == b' ').count()
}

fn strip_ansi(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\u{1b}' {
            while let Some(&next) = chars.peek() {
                chars.next();
                if next.is_ascii_alphabetic() {
                    break;
                }
            }
            continue;
        }
        if c == '\r' {
            continue;
        }
        out.push(c);
    }
    out
}

fn first_meaningful_line(s: &str) -> Option<String> {
    for line in s.lines() {
        let t = line.trim();
        if t.is_empty() || t.starts_with('│') || t.starts_with('└') || t.starts_with('┌') {
            continue;
        }
        if t.contains("Failed") || t.contains("Error") || t.contains("error") {
            return Some(t.to_string());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = "\
┌   skills
│
◇  Source: https://github.com/sthbryan/gitmoji-skill.git @ main
│
◇  Found 1 skill
│
◇  Available Skills
│
│    gitmoji-commits
│
│      Create semantic git commits with gitmoji and Conventional Commits. Use this whenever the user asks to commit, stage changes, split work into multiple commits, choose emojis, or improve commit-message quality.
│
└  Use --skill <name> to install specific skills
";

    const MULTI: &str = "\
◇  Found 2 skills
│
◇  Available Skills
│
│    alpha
│
│      First description.
│
│    beta
│
│      Second description.
│
└  Use --skill <name> to install specific skills
";

    const WITH_REF_SUBPATH: &str = "\
◇  Source: https://github.com/owner/repo.git @ main (skills/code-review-excellence)
│
◇  Found 1 skill
│
◇  Available Skills
│
│    code-review-excellence
│
│      Transform code reviews from gatekeeping to knowledge sharing.
│
└  Use --skill <name> to install specific skills
";

    #[test]
    fn parses_single_skill() {
        let d = parse_skill_list(SAMPLE);
        assert!(d.is_skill);
        assert_eq!(d.total, 1);
        assert!(!d.truncated);
        assert_eq!(d.ref_used.as_deref(), Some("main"));
        assert_eq!(d.skills.len(), 1);
        assert_eq!(d.skills[0].name, "gitmoji-commits");
        assert!(d.skills[0].description.contains("Create semantic"));
    }

    #[test]
    fn parses_multiple_skills() {
        let d = parse_skill_list(MULTI);
        assert!(d.is_skill);
        assert_eq!(d.total, 2);
        assert_eq!(d.skills.len(), 2);
        assert_eq!(d.skills[0].name, "alpha");
        assert_eq!(d.skills[1].name, "beta");
    }

    #[test]
    fn parses_ref_from_source_line() {
        let d = parse_skill_list(WITH_REF_SUBPATH);
        assert!(d.is_skill);
        assert_eq!(d.ref_used.as_deref(), Some("main"));
        assert_eq!(d.skills[0].name, "code-review-excellence");
    }

    #[test]
    fn returns_empty_when_no_available_section() {
        let d = parse_skill_list("nothing here");
        assert!(!d.is_skill);
        assert!(d.skills.is_empty());
    }

    #[test]
    fn strips_ansi_codes() {
        let raw = "\u{1b}[2m◇  Found 1 skill\u{1b}[0m\n\u{1b}[2m│\u{1b}[0m\n\u{1b}[2m◇  Available Skills\u{1b}[0m\n\u{1b}[2m│\u{1b}[0m\n\u{1b}[2m│    foo\u{1b}[0m\n\u{1b}[2m│\u{1b}[0m\n\u{1b}[2m│      bar\u{1b}[0m\n\u{1b}[2m│\u{1b}[0m\n\u{1b}[2m└  done\u{1b}[0m\n";
        let d = parse_skill_list(&strip_ansi(raw));
        assert!(d.is_skill);
        assert_eq!(d.skills[0].name, "foo");
        assert_eq!(d.skills[0].description, "bar");
    }
}

#[cfg(test)]
mod integration_tests {
    use super::*;

    fn parse_file(path: &str) -> Option<SkillDetection> {
        let raw = std::fs::read_to_string(path).ok()?;
        Some(parse_skill_list(&raw))
    }

    #[test]
    fn real_single_skill_repo() {
        let Some(d) = parse_file("/tmp/skill-raw-1.txt") else {
            eprintln!("skipping: /tmp/skill-raw-1.txt not present");
            return;
        };
        assert!(d.is_skill);
        assert_eq!(d.skills.len(), 1);
        assert_eq!(d.skills[0].name, "gitmoji-commits");
    }

    #[test]
    fn real_multi_skill_repo() {
        let Some(d) = parse_file("/tmp/skill-raw-3.txt") else {
            eprintln!("skipping: /tmp/skill-raw-3.txt not present");
            return;
        };
        assert!(d.is_skill);
        assert!(d.total > 100, "expected many skills, got {}", d.total);
        assert!(d.truncated, "expected truncation, got {}", d.skills.len());
        assert_eq!(d.skills.len(), 50);
    }

    #[test]
    fn real_subpath_repo() {
        let Some(d) = parse_file("/tmp/skill-raw-subpath.txt") else {
            eprintln!("skipping: /tmp/skill-raw-subpath.txt not present");
            return;
        };
        assert!(d.is_skill);
        assert_eq!(d.skills.len(), 1);
        assert_eq!(d.skills[0].name, "code-review-excellence");
    }
}

