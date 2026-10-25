use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::errors::{coded, coded_with, key};

use super::scan::read_skill_meta;

/// Directories a repository may keep its skills in.
const AGENT_SKILL_DIRS: &[&str] = &[
    ".agents/skills",
    ".claude/skills",
    ".cline/skills",
    ".codex/skills",
    ".continue/skills",
    ".factory/skills",
    ".gemini/skills",
    ".github/skills",
    ".goose/skills",
    ".kiro/skills",
    ".opencode/skills",
    ".pi/skills",
    ".qoder/skills",
    ".roo/skills",
    ".trae/skills",
    ".windsurf/skills",
];

const SKIP_DIRS: &[&str] = &["node_modules", ".git", "dist", "build", "__pycache__"];

pub(crate) enum Source {
    Local(PathBuf),
    Git(GitSource),
}

pub(crate) struct GitSource {
    pub url: String,
    pub ref_name: Option<String>,
    pub source_type: &'static str,
    pub owner_repo: Option<String>,
    pub subpath: Option<String>,
    pub skill_filter: Option<String>,
}

impl Source {
    pub(crate) fn subpath(&self) -> Option<&str> {
        match self {
            Source::Local(_) => None,
            Source::Git(git) => git.subpath.as_deref(),
        }
    }

    pub(crate) fn skill_filter(&self) -> Option<&str> {
        match self {
            Source::Local(_) => None,
            Source::Git(git) => git.skill_filter.as_deref(),
        }
    }

    pub(crate) fn ref_name(&self) -> Option<&str> {
        match self {
            Source::Local(_) => None,
            Source::Git(git) => git.ref_name.as_deref(),
        }
    }

    pub(crate) fn source_type(&self) -> &'static str {
        match self {
            Source::Local(_) => "local",
            Source::Git(git) => git.source_type,
        }
    }

    pub(crate) fn url(&self) -> String {
        match self {
            Source::Local(path) => path.to_string_lossy().into_owned(),
            Source::Git(git) => git.url.clone(),
        }
    }

    /// The value the CLI stores as `source` in its lockfiles.
    pub(crate) fn lock_source(&self) -> String {
        match self {
            Source::Local(path) => path.to_string_lossy().into_owned(),
            Source::Git(git) => git
                .owner_repo
                .clone()
                .filter(|_| git.source_type == "github")
                .unwrap_or_else(|| git.url.clone()),
        }
    }

    /// Whether the lock entry needs an explicit `sourceUrl`.
    pub(crate) fn needs_source_url(&self, global: bool) -> bool {
        match self {
            Source::Local(_) => false,
            Source::Git(git) => global || git.source_type != "github",
        }
    }
}

fn is_local_path(input: &str) -> bool {
    let path = Path::new(input);
    path.is_absolute()
        || input == "."
        || input == ".."
        || input.starts_with("./")
        || input.starts_with("../")
}

fn is_shorthand(input: &str) -> bool {
    !input.contains(':') && !input.starts_with('.') && !input.starts_with('/')
}

fn split_fragment(input: &str) -> (String, Option<String>, Option<String>) {
    let Some(hash) = input.find('#') else {
        return (input.to_string(), None, None);
    };
    let (base, fragment) = input.split_at(hash);
    let fragment = &fragment[1..];
    if fragment.is_empty() || !base.contains('/') {
        return (input.to_string(), None, None);
    }
    match fragment.split_once('@') {
        Some((reference, skill)) => (
            base.to_string(),
            (!reference.is_empty()).then(|| reference.to_string()),
            (!skill.is_empty()).then(|| skill.to_string()),
        ),
        None => (base.to_string(), Some(fragment.to_string()), None),
    }
}

fn ssh_owner_repo(url: &str) -> Option<String> {
    if let Some(rest) = url.strip_prefix("git@") {
        let path = rest.split_once(':').map(|(_, path)| path)?;
        let path = path.trim_end_matches(".git");
        return path.contains('/').then(|| path.to_string());
    }
    if let Some(rest) = url.strip_prefix("ssh://") {
        let (_, path) = rest.split_once('/')?;
        let path = path.trim_end_matches(".git");
        return path.contains('/').then(|| path.to_string());
    }
    None
}

fn parse_github_url(raw: &str) -> Option<GitSource> {
    let (_, rest) = raw.split_once("://")?;
    let (host, path) = rest.split_once('/')?;
    if !host.eq_ignore_ascii_case("github.com") {
        return None;
    }
    let path = path.split(['?', '#']).next().unwrap_or(path);
    let mut parts = path.split('/').filter(|part| !part.is_empty());
    let owner = parts.next()?;
    let repo = parts.next()?.trim_end_matches(".git");
    let (repo, filter) = match repo.split_once('@') {
        Some((repo, skill)) => (repo, (!skill.is_empty()).then(|| skill.to_string())),
        None => (repo, None),
    };
    if owner.is_empty() || repo.is_empty() {
        return None;
    }

    let mut ref_name = None;
    let mut subpath = None;
    if parts.next() == Some("tree") {
        ref_name = parts.next().map(str::to_string);
        let rest: Vec<&str> = parts.collect();
        if !rest.is_empty() {
            subpath = Some(rest.join("/"));
        }
    }

    Some(GitSource {
        url: format!("https://github.com/{owner}/{repo}.git"),
        ref_name,
        source_type: "github",
        owner_repo: Some(format!("{owner}/{repo}")),
        subpath,
        skill_filter: filter,
    })
}

pub(crate) fn parse_source(input: &str) -> Result<Source, String> {
    let raw = input.trim();
    if raw.is_empty() {
        return Err(coded(key::PACKAGE_REQUIRED));
    }

    if is_local_path(raw) {
        let path = PathBuf::from(raw);
        if !path.exists() {
            return Err(format!("Local path does not exist: {}", path.display()));
        }
        return Ok(Source::Local(path));
    }

    if let Some(rest) = raw.strip_prefix("github:") {
        let (base, reference, filter) = split_fragment(rest);
        let mut github = parse_github_url(&format!("https://github.com/{base}"))
            .ok_or_else(|| coded_with(key::PACKAGE_INVALID, raw))?;
        if reference.is_some() {
            github.ref_name = reference;
        }
        if filter.is_some() {
            github.skill_filter = filter;
        }
        return Ok(Source::Git(github));
    }

    if let Some(rest) = raw.strip_prefix("gitlab:") {
        let (base, reference, filter) = split_fragment(rest);
        return Ok(Source::Git(GitSource {
            url: format!("https://gitlab.com/{base}.git"),
            ref_name: reference,
            source_type: "git",
            owner_repo: None,
            subpath: None,
            skill_filter: filter,
        }));
    }

    let (base, reference, filter) = split_fragment(raw);

    if base.starts_with("git@") || base.starts_with("ssh://") {
        return Ok(Source::Git(GitSource {
            url: base.clone(),
            ref_name: reference,
            source_type: "git",
            owner_repo: ssh_owner_repo(&base),
            subpath: None,
            skill_filter: filter,
        }));
    }

    if base.starts_with("http://") || base.starts_with("https://") {
        if let Some(mut github) = parse_github_url(&base) {
            if reference.is_some() {
                github.ref_name = reference;
            }
            if filter.is_some() {
                github.skill_filter = filter;
            }
            return Ok(Source::Git(github));
        }
        return Ok(Source::Git(GitSource {
            url: base,
            ref_name: reference,
            source_type: "git",
            owner_repo: None,
            subpath: None,
            skill_filter: filter,
        }));
    }

    if is_shorthand(&base) {
        if let Some((repo, skill)) = base.split_once('@') {
            if let Some((owner, name)) = repo.split_once('/') {
                if !owner.is_empty() && !name.is_empty() && !name.contains('/') {
                    return Ok(Source::Git(GitSource {
                        url: format!("https://github.com/{owner}/{name}.git"),
                        ref_name: reference,
                        source_type: "github",
                        owner_repo: Some(format!("{owner}/{name}")),
                        subpath: None,
                        skill_filter: Some(skill.to_string()),
                    }));
                }
            }
        }

        let mut parts = base.split('/');
        if let (Some(owner), Some(repo)) = (parts.next(), parts.next()) {
            let rest: Vec<&str> = parts.collect();
            if !owner.is_empty() && !repo.is_empty() {
                return Ok(Source::Git(GitSource {
                    url: format!("https://github.com/{owner}/{repo}.git"),
                    ref_name: reference,
                    source_type: "github",
                    owner_repo: Some(format!("{owner}/{repo}")),
                    subpath: (!rest.is_empty()).then(|| rest.join("/")),
                    skill_filter: filter,
                }));
            }
        }
    }

    Err(coded_with(key::PACKAGE_INVALID, raw))
}

/// A downloaded or local package tree that is removed when it goes out of scope.
pub(crate) struct SourceDir {
    pub(crate) root: PathBuf,
    temp: bool,
}

impl Drop for SourceDir {
    fn drop(&mut self) {
        if self.temp {
            let _ = fs::remove_dir_all(&self.root);
        }
    }
}

impl SourceDir {
    /// Repository-relative location of a skill, in the shape the lockfiles use.
    pub(crate) fn skill_path(&self, dir: &Path) -> String {
        let relative = dir.strip_prefix(&self.root).unwrap_or(dir);
        let relative = relative.to_string_lossy().replace('\\', "/");
        let relative = relative.trim_matches('/');
        if relative.is_empty() {
            "SKILL.md".to_string()
        } else {
            format!("{relative}/SKILL.md")
        }
    }
}

pub(crate) fn acquire(source: &Source) -> Result<SourceDir, String> {
    match source {
        Source::Local(path) => Ok(SourceDir {
            root: path.clone(),
            temp: false,
        }),
        Source::Git(git) => clone_repo(git),
    }
}

fn temp_root() -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or_default();
    std::env::temp_dir().join(format!("curie-skill-{}-{nanos}", std::process::id()))
}

fn clone_command(url: &str, ref_name: Option<&str>, dest: &Path) -> Command {
    let mut cmd = Command::new("git");
    cmd.arg("clone").arg("--quiet");
    if let Some(reference) = ref_name.filter(|r| !r.is_empty()) {
        cmd.arg("--depth").arg("1").arg("--branch").arg(reference);
    } else {
        cmd.arg("--depth").arg("1");
    }
    cmd.arg(url).arg(dest);
    // Never block the app behind an interactive credential prompt.
    cmd.env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_LFS_SKIP_SMUDGE", "1");
    cmd
}

fn first_line(stderr: &[u8]) -> String {
    String::from_utf8_lossy(stderr)
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .unwrap_or("git clone failed")
        .to_string()
}

fn clone_repo(git: &GitSource) -> Result<SourceDir, String> {
    let root = temp_root();
    let output = clone_command(&git.url, git.ref_name.as_deref(), &root)
        .output()
        .map_err(|e| format!("Failed to run git: {e}"))?;
    if output.status.success() {
        return Ok(SourceDir { root, temp: true });
    }

    let message = first_line(&output.stderr);
    let sha_like = git
        .ref_name
        .as_deref()
        .map(|r| r.len() == 40 && r.chars().all(|c| c.is_ascii_hexdigit()))
        .unwrap_or(false);
    let _ = fs::remove_dir_all(&root);

    if sha_like {
        let reference = git.ref_name.clone().unwrap_or_default();
        let cloned = clone_command(&git.url, None, &root)
            .output()
            .map_err(|e| format!("Failed to run git: {e}"))?;
        if cloned.status.success() {
            let checkout = Command::new("git")
                .arg("-C")
                .arg(&root)
                .arg("checkout")
                .arg("--quiet")
                .arg(&reference)
                .env("GIT_TERMINAL_PROMPT", "0")
                .output()
                .map_err(|e| format!("Failed to run git: {e}"))?;
            if checkout.status.success() {
                return Ok(SourceDir { root, temp: true });
            }
            let _ = fs::remove_dir_all(&root);
            return Err(format!(
                "Failed to check out {reference}: {}",
                first_line(&checkout.stderr)
            ));
        }
        let _ = fs::remove_dir_all(&root);
    }

    Err(format!("Failed to clone {}: {message}", git.url))
}

pub(crate) struct DiscoveredSkill {
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) dir: PathBuf,
    pub(crate) internal: bool,
}

fn parse_skill(dir: &Path) -> Option<DiscoveredSkill> {
    let meta = read_skill_meta(&dir.join("SKILL.md"))?;
    Some(DiscoveredSkill {
        name: meta.name,
        description: meta.description,
        dir: dir.to_path_buf(),
        internal: meta.internal,
    })
}

fn push_skill(dir: &Path, found: &mut Vec<DiscoveredSkill>, seen: &mut HashSet<String>) -> bool {
    let Some(skill) = parse_skill(dir) else {
        return false;
    };
    if !seen.insert(skill.name.clone()) {
        return true;
    }
    found.push(skill);
    true
}

fn walk(
    dir: &Path,
    remaining: usize,
    found: &mut Vec<DiscoveredSkill>,
    seen: &mut HashSet<String>,
) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if SKIP_DIRS.contains(&name.as_str()) {
            continue;
        }
        if path.join("SKILL.md").is_file() {
            push_skill(&path, found, seen);
        } else if remaining > 1 {
            walk(&path, remaining - 1, found, seen);
        }
    }
}

fn walk_deep(
    dir: &Path,
    remaining: usize,
    found: &mut Vec<DiscoveredSkill>,
    seen: &mut HashSet<String>,
) {
    if remaining == 0 {
        return;
    }
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if SKIP_DIRS.contains(&name.as_str()) {
            continue;
        }
        if path.join("SKILL.md").is_file() {
            push_skill(&path, found, seen);
        } else {
            walk_deep(&path, remaining - 1, found, seen);
        }
    }
}

fn validate_subpath(subpath: &str) -> Result<(), String> {
    if subpath.split(['/', '\\']).any(|segment| segment == "..") {
        return Err(format!(
            "Invalid subpath: \"{subpath}\" resolves outside the repository directory"
        ));
    }
    Ok(())
}

pub(crate) fn discover_skills(
    base: &Path,
    subpath: Option<&str>,
) -> Result<Vec<DiscoveredSkill>, String> {
    let root = match subpath.map(str::trim).filter(|s| !s.is_empty()) {
        Some(subpath) => {
            validate_subpath(subpath)?;
            base.join(subpath)
        }
        None => base.to_path_buf(),
    };
    if !root.is_dir() {
        return Err(format!("Skill path not found: {}", root.display()));
    }

    let mut found = Vec::new();
    let mut seen = HashSet::new();

    if root.join("SKILL.md").is_file() {
        push_skill(&root, &mut found, &mut seen);
        found.sort_by_key(|skill| skill.name.to_lowercase());
        return Ok(found);
    }

    let mut dirs = vec![root.clone()];
    for name in [
        "skills",
        "skills/.curated",
        "skills/.experimental",
        "skills/.system",
    ] {
        dirs.push(root.join(name));
    }
    for name in AGENT_SKILL_DIRS {
        dirs.push(root.join(name));
    }

    for dir in &dirs {
        let depth = if dir == &root { 1 } else { 3 };
        walk(dir, depth, &mut found, &mut seen);
    }

    if found.is_empty() {
        walk_deep(&root, 5, &mut found, &mut seen);
    }

    // Directory order is filesystem-dependent; a stable list keeps the picker
    // and the install order identical between runs.
    found.sort_by_key(|skill| skill.name.to_lowercase());

    Ok(found)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "curie-source-{tag}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

    fn write_skill(root: &Path, relative: &str, name: &str, description: &str) -> PathBuf {
        let dir = root.join(relative);
        fs::create_dir_all(&dir).expect("skill dir");
        fs::write(
            dir.join("SKILL.md"),
            format!("---\nname: {name}\ndescription: {description}\n---\n\nBody.\n"),
        )
        .expect("skill file");
        dir
    }

    #[test]
    fn parses_github_shorthand_with_a_skill_filter() {
        let Source::Git(git) = parse_source("sthbryan/curie@write-docs").expect("source") else {
            panic!("expected a git source");
        };
        assert_eq!(git.url, "https://github.com/sthbryan/curie.git");
        assert_eq!(git.owner_repo.as_deref(), Some("sthbryan/curie"));
        assert_eq!(git.skill_filter.as_deref(), Some("write-docs"));
        assert_eq!(git.source_type, "github");
    }

    #[test]
    fn parses_shorthand_with_a_subpath_and_ref() {
        let Source::Git(git) = parse_source("owner/repo/skills/alpha#v2").expect("source") else {
            panic!("expected a git source");
        };
        assert_eq!(git.subpath.as_deref(), Some("skills/alpha"));
        assert_eq!(git.ref_name.as_deref(), Some("v2"));
        assert_eq!(git.owner_repo.as_deref(), Some("owner/repo"));
    }

    #[test]
    fn parses_github_tree_urls() {
        let Source::Git(git) =
            parse_source("https://github.com/owner/repo/tree/main/skills/alpha").expect("source")
        else {
            panic!("expected a git source");
        };
        assert_eq!(git.ref_name.as_deref(), Some("main"));
        assert_eq!(git.subpath.as_deref(), Some("skills/alpha"));
        assert_eq!(git.url, "https://github.com/owner/repo.git");
    }

    #[test]
    fn parses_a_repo_url_with_dot_git() {
        let Source::Git(git) = parse_source("https://github.com/owner/repo.git").expect("source")
        else {
            panic!("expected a git source");
        };
        assert_eq!(git.owner_repo.as_deref(), Some("owner/repo"));
        assert_eq!(git.url, "https://github.com/owner/repo.git");
    }

    #[test]
    fn parses_a_fragment_ref_for_a_repo_url() {
        let Source::Git(git) = parse_source("owner/repo#feature/x").expect("source") else {
            panic!("expected a git source");
        };
        assert_eq!(git.ref_name.as_deref(), Some("feature/x"));
    }

    #[test]
    fn accepts_an_existing_local_directory() {
        let dir = temp_dir("local");
        let source = parse_source(dir.to_str().unwrap()).expect("source");
        assert!(matches!(source, Source::Local(path) if path == dir));
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_a_missing_local_directory() {
        let dir = temp_dir("missing").join("nope");
        assert!(parse_source(dir.to_str().unwrap()).is_err());
        let _ = fs::remove_dir_all(dir.parent().unwrap());
    }

    #[test]
    fn rejects_unparseable_input() {
        assert!(parse_source("not a package").is_err());
        assert!(parse_source("").is_err());
        assert!(parse_source("--global").is_err());
    }

    #[test]
    fn discovers_skills_in_priority_directories() {
        let root = temp_dir("discover");
        write_skill(&root, "skills/alpha", "alpha", "First");
        write_skill(&root, ".claude/skills/beta", "beta", "Second");
        fs::create_dir_all(root.join("node_modules/junk")).expect("junk");
        fs::write(
            root.join("node_modules/junk/SKILL.md"),
            "---\nname: junk\n---",
        )
        .expect("junk");

        let found = discover_skills(&root, None).expect("discover");
        let names: Vec<&str> = found.iter().map(|s| s.name.as_str()).collect();
        assert_eq!(names, vec!["alpha", "beta"]);

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_root_skill_wins_over_nested_ones() {
        let root = temp_dir("root-skill");
        write_skill(&root, "", "alpha", "First");
        write_skill(&root, "skills/beta", "beta", "Second");

        let found = discover_skills(&root, None).expect("discover");
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].name, "alpha");

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn discovers_deep_layouts_when_nothing_is_standard() {
        let root = temp_dir("deep");
        write_skill(&root, "packages/tools/alpha", "alpha", "First");

        let found = discover_skills(&root, None).expect("discover");
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].name, "alpha");

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_subpath_limits_the_search() {
        let root = temp_dir("subpath");
        write_skill(&root, "one/alpha", "alpha", "First");
        write_skill(&root, "two/beta", "beta", "Second");

        let found = discover_skills(&root, Some("two")).expect("discover");
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].name, "beta");

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn rejects_a_traversing_subpath() {
        let root = temp_dir("traversal");
        assert!(discover_skills(&root, Some("../elsewhere")).is_err());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn reports_internal_skills() {
        let root = temp_dir("internal");
        let dir = root.join("skills/hidden");
        fs::create_dir_all(&dir).expect("skill dir");
        fs::write(
            dir.join("SKILL.md"),
            "---\nname: hidden\ndescription: Secret\nmetadata:\n  internal: true\n---\n",
        )
        .expect("skill file");

        let found = discover_skills(&root, None).expect("discover");
        assert_eq!(found.len(), 1);
        assert!(found[0].internal);

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn skill_paths_are_lockfile_relative() {
        let workspace = SourceDir {
            root: PathBuf::from("/tmp/repo"),
            temp: false,
        };
        assert_eq!(
            workspace.skill_path(Path::new("/tmp/repo/skills/alpha")),
            "skills/alpha/SKILL.md"
        );
        assert_eq!(workspace.skill_path(Path::new("/tmp/repo")), "SKILL.md");
    }
}
