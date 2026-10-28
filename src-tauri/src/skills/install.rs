use std::fs;
use std::io;
use std::path::{Component, Path, PathBuf};

use sha2::{Digest, Sha256};

use crate::errors::{coded, coded_with, key};

use super::scan::{candidate_roots, sanitize_name};
use super::scope::Scope;

const SKIP_COPY_FILES: &[&str] = &["metadata.json"];
const SKIP_COPY_DIRS: &[&str] = &[".git", "__pycache__", "__pypackages__"];
const SKIP_HASH_DIRS: &[&str] = &[".git", "node_modules"];

/// Where a scope keeps the canonical copy and the agent links that point at it.
pub(crate) struct Targets {
    pub(crate) canonical: PathBuf,
    pub(crate) links: Vec<PathBuf>,
}

pub(crate) fn targets(scope: &Scope) -> Result<Targets, String> {
    let base = match scope {
        Scope::Global => dirs::home_dir().ok_or_else(|| coded(key::HOME_MISSING))?,
        Scope::Project(path) => path.clone(),
    };
    let canonical = base.join(".agents").join("skills");
    let links = candidate_roots(scope, &base)
        .into_iter()
        .filter(|root| !root.canonical && root.agent_present)
        .map(|root| root.path)
        .collect();

    Ok(Targets { canonical, links })
}

fn same_path(a: &Path, b: &Path) -> bool {
    match (fs::canonicalize(a), fs::canonicalize(b)) {
        (Ok(a), Ok(b)) => a == b,
        _ => a == b,
    }
}

fn remove_path(path: &Path) -> io::Result<()> {
    match fs::symlink_metadata(path) {
        Ok(meta) if meta.is_dir() && !meta.file_type().is_symlink() => fs::remove_dir_all(path),
        Ok(_) => fs::remove_file(path),
        Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e),
    }
}

pub(crate) fn copy_contents(src: &Path, dest: &Path) -> io::Result<()> {
    fs::create_dir_all(dest)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        let from = entry.path();
        let to = dest.join(&name);
        let file_type = entry.file_type()?;

        if file_type.is_symlink() {
            let resolved = fs::canonicalize(&from).unwrap_or_else(|_| from.clone());
            if resolved.is_dir() {
                copy_contents(&resolved, &to)?;
            } else if resolved.is_file() {
                fs::copy(&resolved, &to)?;
            }
            continue;
        }

        if file_type.is_dir() {
            if SKIP_COPY_DIRS.contains(&name_str.as_ref()) {
                continue;
            }
            copy_contents(&from, &to)?;
        } else if file_type.is_file() {
            if SKIP_COPY_FILES.contains(&name_str.as_ref()) {
                continue;
            }
            fs::copy(&from, &to)?;
        }
    }
    Ok(())
}

fn replace_dir(src: &Path, dest: &Path) -> Result<(), String> {
    remove_path(dest).map_err(|_| coded_with(key::WRITE_FAILED, dest.display()))?;
    copy_contents(src, dest)
        .map_err(|e| coded_with(key::WRITE_FAILED, format!("{}: {e}", dest.display())))
}

fn relative_path(from: &Path, to: &Path) -> PathBuf {
    let from: Vec<Component> = from.components().collect();
    let to: Vec<Component> = to.components().collect();
    let common = from.iter().zip(&to).take_while(|(a, b)| a == b).count();

    let mut out = PathBuf::new();
    for _ in common..from.len() {
        out.push("..");
    }
    for component in &to[common..] {
        out.push(component.as_os_str());
    }
    out
}

/// Links an agent directory at the canonical copy, copying when links are unavailable.
fn link_dir(target: &Path, link: &Path) -> bool {
    let Some(parent) = link.parent() else {
        return false;
    };
    if fs::create_dir_all(parent).is_err() {
        return false;
    }
    let _ = remove_path(link);

    #[cfg(unix)]
    {
        let relative = relative_path(parent, target);
        if std::os::unix::fs::symlink(&relative, link).is_ok() {
            return true;
        }
    }

    #[cfg(windows)]
    {
        if std::os::windows::fs::symlink_dir(target, link).is_ok() {
            return true;
        }
    }

    replace_dir(target, link).is_ok()
}

/// Copies a skill into the canonical directory and points every agent at it.
pub(crate) fn install_skill(
    targets: &Targets,
    source: &Path,
    name: &str,
) -> Result<PathBuf, String> {
    let dir_name = sanitize_name(name);
    let canonical = targets.canonical.join(&dir_name);

    if !same_path(source, &canonical) {
        replace_dir(source, &canonical)?;
    }

    for link_dir_path in &targets.links {
        let link = link_dir_path.join(&dir_name);
        if same_path(&link, &canonical) {
            continue;
        }
        link_dir(&canonical, &link);
    }

    Ok(canonical)
}

/// Removes a skill folder from the canonical directory and every agent link.
pub(crate) fn remove_skill(targets: &Targets, dir_name: &str) -> bool {
    let mut removed = false;
    for root in targets
        .links
        .iter()
        .chain(std::iter::once(&targets.canonical))
    {
        let path = root.join(dir_name);
        if fs::symlink_metadata(&path).is_ok() {
            removed |= remove_path(&path).is_ok();
        }
    }
    removed
}

fn collect_files(base: &Path, dir: &Path, out: &mut Vec<(String, Vec<u8>)>) -> io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let file_type = entry.file_type()?;
        if file_type.is_symlink() {
            continue;
        }
        if file_type.is_dir() {
            if SKIP_HASH_DIRS.contains(&entry.file_name().to_string_lossy().as_ref()) {
                continue;
            }
            collect_files(base, &path, out)?;
        } else if file_type.is_file() {
            let relative = path
                .strip_prefix(base)
                .unwrap_or(&path)
                .to_string_lossy()
                .replace('\\', "/");
            out.push((relative, fs::read(&path)?));
        }
    }
    Ok(())
}

/// Content hash the skills CLI writes as `computedHash` in a project lockfile.
pub(crate) fn folder_hash(dir: &Path) -> Option<String> {
    let mut files = Vec::new();
    collect_files(dir, dir, &mut files).ok()?;
    files.sort_by(|a, b| a.0.cmp(&b.0));

    let mut hasher = Sha256::new();
    for (path, bytes) in files {
        hasher.update(path.as_bytes());
        hasher.update(&bytes);
    }
    Some(format!("{:x}", hasher.finalize()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("curie-install-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).expect("temp dir");
        dir
    }

    fn write_skill(dir: &Path, name: &str) {
        fs::create_dir_all(dir).expect("skill dir");
        fs::write(
            dir.join("SKILL.md"),
            format!("---\nname: {name}\ndescription: {name} skill\n---\n"),
        )
        .expect("skill file");
    }

    #[test]
    fn installs_into_the_canonical_directory_and_links_agents() {
        let root = temp_dir("project");
        fs::create_dir_all(root.join(".claude")).expect("agent");
        let source = temp_dir("source");
        write_skill(&source, "alpha");
        fs::write(source.join("metadata.json"), "{}").expect("metadata");

        let targets = targets(&Scope::Project(root.clone())).expect("targets");
        let canonical = install_skill(&targets, &source, "alpha").expect("install");

        assert_eq!(canonical, root.join(".agents/skills/alpha"));
        assert!(canonical.join("SKILL.md").is_file());
        assert!(!canonical.join("metadata.json").exists());

        let link = root.join(".claude/skills/alpha");
        assert!(link.exists());
        assert_eq!(
            fs::read(link.join("SKILL.md")).unwrap(),
            fs::read(canonical.join("SKILL.md")).unwrap()
        );

        let _ = fs::remove_dir_all(&root);
        let _ = fs::remove_dir_all(&source);
    }

    #[test]
    fn links_using_a_relative_target() {
        let root = temp_dir("relative");
        fs::create_dir_all(root.join(".claude")).expect("agent");
        let canonical = root.join(".agents/skills/alpha");
        write_skill(&canonical, "alpha");

        let targets = targets(&Scope::Project(root.clone())).expect("targets");
        assert_eq!(targets.links, vec![root.join(".claude/skills")]);

        fs::create_dir_all(root.join(".claude/skills")).expect("agent skills");
        assert!(link_dir(&canonical, &root.join(".claude/skills/alpha")));

        #[cfg(unix)]
        {
            let target = fs::read_link(root.join(".claude/skills/alpha")).expect("readlink");
            assert!(target.is_relative());
        }

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn removes_the_skill_and_its_links() {
        let root = temp_dir("remove");
        fs::create_dir_all(root.join(".claude")).expect("agent");
        let source = temp_dir("source-remove");
        write_skill(&source, "alpha");

        let targets = targets(&Scope::Project(root.clone())).expect("targets");
        install_skill(&targets, &source, "alpha").expect("install");

        assert!(remove_skill(&targets, "alpha"));
        assert!(!root.join(".agents/skills/alpha").exists());
        assert!(!root.join(".claude/skills/alpha").exists());
        assert!(!remove_skill(&targets, "alpha"));

        let _ = fs::remove_dir_all(&root);
        let _ = fs::remove_dir_all(&source);
    }

    #[test]
    fn hashes_ignore_git_and_node_modules() {
        let root = temp_dir("hash");
        write_skill(&root, "alpha");
        fs::create_dir_all(root.join(".git")).expect("git");
        fs::write(root.join(".git/config"), "x").expect("git file");

        let first = folder_hash(&root).expect("hash");
        fs::write(root.join(".git/config"), "changed").expect("git file");
        assert_eq!(folder_hash(&root).as_deref(), Some(first.as_str()));

        fs::write(root.join("SKILL.md"), "changed").expect("skill");
        assert_ne!(folder_hash(&root).as_deref(), Some(first.as_str()));

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn relative_paths_climb_out_of_the_link_directory() {
        assert_eq!(
            relative_path(
                Path::new("/tmp/repo/.claude/skills"),
                Path::new("/tmp/repo/.agents/skills/alpha")
            ),
            PathBuf::from("../../.agents/skills/alpha")
        );
    }

    #[test]
    fn sanitized_names_stay_inside_the_skill_directory() {
        let root = temp_dir("traversal");
        let targets = targets(&Scope::Project(root.clone())).expect("targets");
        let source = temp_dir("traversal-source");
        write_skill(&source, "alpha");

        let canonical = install_skill(&targets, &source, "../../escape").expect("install");
        assert!(canonical.starts_with(&targets.canonical));

        let _ = fs::remove_dir_all(&root);
        let _ = fs::remove_dir_all(&source);
    }
}
