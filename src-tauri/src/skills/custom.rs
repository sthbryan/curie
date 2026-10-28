use super::scope::Scope;
use super::source::{parse_skill, Source};
use super::types::CustomSkillInstallResult;
use crate::errors::{coded, coded_with, key};
use std::fs;
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

/// What a skill bundle may unpack to. The API limit for an uploaded skill is
/// 30 MB uncompressed, so anything past that is a mistake or a zip bomb.
const MAX_ARCHIVE_BYTES: u64 = 30 * 1024 * 1024;
const MAX_ARCHIVE_ENTRY_BYTES: u64 = 10 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES: usize = 1_000;
const IGNORED_ARCHIVE_DIRS: &[&str] = &["__MACOSX"];

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
    if let Err(reason) = super::add::install_source(scope, &Source::Local(base.clone()), None) {
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

/// Installs a skill from a folder or an archive, copying the whole bundle into
/// the app's custom store first so the installed copy outlives the original.
pub fn install_custom_from_path_in(
    scope: &Scope,
    path: &Path,
) -> Result<CustomSkillInstallResult, String> {
    let meta = fs::metadata(path).map_err(|_| coded_with(key::READ_FAILED, path.display()))?;

    let (root, _staging) = if meta.is_dir() {
        (skill_root(path)?, None)
    } else if meta.is_file() {
        let staging = Staging::new()?;
        extract_archive(path, staging.path())?;
        let root = skill_root(staging.path())?;
        (root, Some(staging))
    } else {
        return Err(coded_with(key::READ_FAILED, path.display()));
    };

    let store = crate::paths::custom_skills_dir()?;
    install_from_root(scope, path, &root, &store)
}

fn install_from_root(
    scope: &Scope,
    origin: &Path,
    root: &Path,
    store: &Path,
) -> Result<CustomSkillInstallResult, String> {
    let skill = parse_skill(root)
        .ok_or_else(|| "SKILL.md needs a name and a description at the top".to_string())?;
    if !is_valid_skill_name(&skill.name) {
        return Err(format!(
            "\"{}\" won't work as a skill name: use letters, digits, dashes, dots and underscores",
            skill.name
        ));
    }

    let base = store.join(&skill.name);
    let previous = store_skill(root, &base)?;

    if let Err(reason) = super::add::install_source(scope, &Source::Local(base.clone()), None) {
        restore_store(&base, previous);
        return Err(reason);
    }
    if let Some(backup) = previous {
        let _ = fs::remove_dir_all(backup);
    }

    Ok(CustomSkillInstallResult {
        name: skill.name,
        path: base.join("SKILL.md").to_string_lossy().to_string(),
        message: format!("Installed custom skill from {}", origin.display()),
    })
}

/// The skill folder inside a bundle: the bundle itself, or its only child that
/// carries a SKILL.md. Archives from Finder and Claude wrap it in a folder.
fn skill_root(dir: &Path) -> Result<PathBuf, String> {
    if dir.join("SKILL.md").is_file() {
        return Ok(dir.to_path_buf());
    }

    let mut candidates: Vec<PathBuf> = fs::read_dir(dir)
        .map_err(|_| coded_with(key::READ_FAILED, dir.display()))?
        .flatten()
        .filter(|entry| entry.file_type().map(|kind| kind.is_dir()).unwrap_or(false))
        .filter(|entry| {
            !IGNORED_ARCHIVE_DIRS.contains(&entry.file_name().to_string_lossy().as_ref())
        })
        .map(|entry| entry.path())
        .filter(|path| path.join("SKILL.md").is_file())
        .collect();
    candidates.sort();

    match candidates.len() {
        1 => Ok(candidates.remove(0)),
        0 => Err("No SKILL.md found at the top of that skill".into()),
        count => Err(format!(
            "That bundle holds {count} skills; install them one at a time"
        )),
    }
}

fn same_path(a: &Path, b: &Path) -> bool {
    match (fs::canonicalize(a), fs::canonicalize(b)) {
        (Ok(a), Ok(b)) => a == b,
        _ => a == b,
    }
}

/// Replaces the stored copy, keeping the previous one until the install ends.
fn store_skill(source: &Path, base: &Path) -> Result<Option<PathBuf>, String> {
    if same_path(source, base) {
        return Ok(None);
    }

    let parent = base
        .parent()
        .ok_or_else(|| coded_with(key::WRITE_FAILED, base.display()))?;
    fs::create_dir_all(parent)
        .map_err(|_| coded_with(key::DIR_CREATE_FAILED, parent.display()))?;

    let previous = if base.exists() {
        let name = base.file_name().unwrap_or_default().to_string_lossy().to_string();
        let backup = parent.join(format!(".{name}.bak-{}", std::process::id()));
        let _ = fs::remove_dir_all(&backup);
        fs::rename(base, &backup).map_err(|_| coded_with(key::WRITE_FAILED, base.display()))?;
        Some(backup)
    } else {
        None
    };

    if let Err(reason) = super::install::copy_contents(source, base) {
        restore_store(base, previous);
        return Err(coded_with(
            key::WRITE_FAILED,
            format!("{}: {reason}", base.display()),
        ));
    }

    Ok(previous)
}

fn restore_store(base: &Path, previous: Option<PathBuf>) {
    let _ = fs::remove_dir_all(base);
    if let Some(backup) = previous {
        let _ = fs::rename(backup, base);
    }
}

fn extract_archive(path: &Path, dest: &Path) -> Result<(), String> {
    let file = fs::File::open(path).map_err(|_| coded_with(key::READ_FAILED, path.display()))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|_| "That file is not a valid .zip or .skill archive".to_string())?;

    if archive.len() > MAX_ARCHIVE_ENTRIES {
        return Err(format!(
            "That archive holds more than {MAX_ARCHIVE_ENTRIES} entries"
        ));
    }

    let mut total = 0u64;
    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .map_err(|error| format!("Could not read that archive: {error}"))?;

        let Some(relative) = entry.enclosed_name() else {
            return Err("That archive contains a path that escapes the skill folder".into());
        };
        if is_ignored_archive_path(&relative) {
            continue;
        }
        if entry.is_symlink() {
            return Err("That archive contains a symlink; unpack it and install the folder".into());
        }

        let target = dest.join(&relative);
        if entry.is_dir() {
            fs::create_dir_all(&target)
                .map_err(|_| coded_with(key::DIR_CREATE_FAILED, target.display()))?;
            continue;
        }

        let declared = entry.size();
        if declared > MAX_ARCHIVE_ENTRY_BYTES {
            return Err(format!(
                "{} is larger than the 10 MB limit",
                relative.display()
            ));
        }
        total += declared;
        if total > MAX_ARCHIVE_BYTES {
            return Err("That archive unpacks to more than 30 MB".into());
        }

        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)
                .map_err(|_| coded_with(key::DIR_CREATE_FAILED, parent.display()))?;
        }
        let mut out = fs::File::create(&target)
            .map_err(|_| coded_with(key::WRITE_FAILED, target.display()))?;
        let mut reader = (&mut entry).take(MAX_ARCHIVE_ENTRY_BYTES + 1);
        let copied = io::copy(&mut reader, &mut out)
            .map_err(|_| coded_with(key::WRITE_FAILED, target.display()))?;
        if copied > MAX_ARCHIVE_ENTRY_BYTES {
            return Err(format!(
                "{} is larger than the 10 MB limit",
                relative.display()
            ));
        }
    }

    Ok(())
}

fn is_ignored_archive_path(path: &Path) -> bool {
    let first = path.components().next().and_then(|part| part.as_os_str().to_str());
    if first.map(|name| IGNORED_ARCHIVE_DIRS.contains(&name)).unwrap_or(false) {
        return true;
    }
    path.file_name().and_then(|name| name.to_str()) == Some(".DS_Store")
}

/// Unpacked archives live here only while the install runs.
struct Staging {
    path: PathBuf,
}

impl Staging {
    fn new() -> Result<Self, String> {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|elapsed| elapsed.as_nanos())
            .unwrap_or(0);
        let path = std::env::temp_dir().join(format!("curie-skill-{}-{nanos}", std::process::id()));
        fs::create_dir_all(&path)
            .map_err(|_| coded_with(key::DIR_CREATE_FAILED, path.display()))?;
        Ok(Self { path })
    }

    fn path(&self) -> &Path {
        &self.path
    }
}

impl Drop for Staging {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
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

    let meta = fs::metadata(path).map_err(|_| coded_with(key::READ_FAILED, path.display()))?;
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

#[cfg(test)]
mod path_tests {
    use super::*;
    use std::io::Write;

    const SKILL: &str = "---\nname: my-skill\ndescription: does things\n---\nbody";

    fn temp_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "curie-bundle-{tag}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn write_file(root: &Path, relative: &str, body: &str) {
        let path = root.join(relative);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, body).unwrap();
    }

    fn write_zip(path: &Path, entries: &[(&str, &str)]) {
        let file = fs::File::create(path).unwrap();
        let mut writer = zip::ZipWriter::new(file);
        for (name, body) in entries {
            let options = zip::write::SimpleFileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated);
            writer.start_file(*name, options).unwrap();
            writer.write_all(body.as_bytes()).unwrap();
        }
        writer.finish().unwrap();
    }

    fn skill_folder(root: &Path, name: &str) -> PathBuf {
        let dir = root.join(name);
        write_file(&dir, "SKILL.md", SKILL);
        write_file(&dir, "scripts/run.sh", "echo hi");
        write_file(&dir, "references/notes.md", "# notes");
        write_file(&dir, "assets/logo.txt", "logo");
        dir
    }

    #[test]
    fn stores_the_whole_folder_including_scripts_and_references() {
        let dir = temp_dir("store");
        let source = skill_folder(&dir, "my-skill");
        let base = dir.join("store/my-skill");

        let previous = store_skill(&source, &base).unwrap();

        assert!(previous.is_none());
        assert!(base.join("SKILL.md").is_file());
        assert!(base.join("scripts/run.sh").is_file());
        assert!(base.join("references/notes.md").is_file());
        assert!(base.join("assets/logo.txt").is_file());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn installs_a_folder_into_the_project_with_its_scripts() {
        let dir = temp_dir("e2e");
        let project = dir.join("project");
        fs::create_dir_all(project.join(".claude")).unwrap();
        let source = skill_folder(&dir, "my-skill");
        let store = dir.join("store");

        let result = install_from_root(
            &Scope::Project(project.clone()),
            &source,
            &source,
            &store,
        )
        .unwrap();

        assert_eq!(result.name, "my-skill");
        assert!(store.join("my-skill/scripts/run.sh").is_file());
        assert!(project.join(".agents/skills/my-skill/SKILL.md").is_file());
        assert!(project.join(".agents/skills/my-skill/scripts/run.sh").is_file());
        assert!(project
            .join(".agents/skills/my-skill/references/notes.md")
            .is_file());
        assert!(project.join("skills-lock.json").is_file());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn storing_the_same_path_keeps_it_in_place() {
        let dir = temp_dir("same");
        let base = skill_folder(&dir, "my-skill");

        let previous = store_skill(&base, &base).unwrap();

        assert!(previous.is_none());
        assert!(base.join("SKILL.md").is_file());
        assert!(base.join("scripts/run.sh").is_file());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn replacing_a_stored_copy_keeps_the_previous_one_until_cleaned() {
        let dir = temp_dir("replace");
        let base = dir.join("store/my-skill");
        write_file(&base, "old.txt", "old");
        let source = skill_folder(&dir, "my-skill");

        let previous = store_skill(&source, &base).unwrap();

        assert!(!base.join("old.txt").exists());
        assert!(base.join("scripts/run.sh").is_file());
        let backup = previous.expect("backup");
        assert!(backup.join("old.txt").is_file());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn finds_the_only_skill_folder_inside_a_bundle() {
        let dir = temp_dir("root");
        let nested = skill_folder(&dir, "my-skill");

        assert_eq!(skill_root(&dir).unwrap(), nested);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn accepts_a_skill_file_at_the_top_of_the_bundle() {
        let dir = temp_dir("flat");
        write_file(&dir, "SKILL.md", SKILL);

        assert_eq!(skill_root(&dir).unwrap(), dir);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn ignores_macos_junk_when_looking_for_the_skill() {
        let dir = temp_dir("junk");
        let nested = skill_folder(&dir, "my-skill");
        write_file(&dir, "__MACOSX/._my-skill", "junk");

        assert_eq!(skill_root(&dir).unwrap(), nested);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_a_bundle_with_several_skills() {
        let dir = temp_dir("many");
        skill_folder(&dir, "alpha");
        skill_folder(&dir, "beta");

        assert!(skill_root(&dir).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_a_bundle_without_a_skill_file() {
        let dir = temp_dir("empty");
        write_file(&dir, "README.md", "nothing");

        assert!(skill_root(&dir).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn extracts_an_archive_with_a_single_skill_folder() {
        let dir = temp_dir("zip");
        let archive = dir.join("my-skill.zip");
        write_zip(
            &archive,
            &[
                ("my-skill/SKILL.md", SKILL),
                ("my-skill/scripts/run.sh", "echo hi"),
                ("my-skill/references/notes.md", "# notes"),
            ],
        );
        let dest = dir.join("out");
        fs::create_dir_all(&dest).unwrap();

        extract_archive(&archive, &dest).unwrap();

        assert!(dest.join("my-skill/SKILL.md").is_file());
        assert!(dest.join("my-skill/scripts/run.sh").is_file());
        assert_eq!(skill_root(&dest).unwrap(), dest.join("my-skill"));
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn accepts_an_archive_with_the_skill_file_at_the_top() {
        let dir = temp_dir("zip-flat");
        let archive = dir.join("my-skill.skill");
        write_zip(&archive, &[("SKILL.md", SKILL)]);
        let dest = dir.join("out");
        fs::create_dir_all(&dest).unwrap();

        extract_archive(&archive, &dest).unwrap();

        assert!(dest.join("SKILL.md").is_file());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_an_archive_that_escapes_the_destination() {
        let dir = temp_dir("slip");
        let archive = dir.join("evil.zip");
        write_zip(&archive, &[("../evil.txt", "pwned")]);
        let dest = dir.join("out");
        fs::create_dir_all(&dest).unwrap();

        assert!(extract_archive(&archive, &dest).is_err());
        assert!(!dir.join("evil.txt").exists());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_symlinks_inside_archives() {
        let dir = temp_dir("link");
        let archive = dir.join("link.zip");
        let file = fs::File::create(&archive).unwrap();
        let mut writer = zip::ZipWriter::new(file);
        let options = zip::write::SimpleFileOptions::default();
        writer
            .add_symlink("my-skill/link", "../../etc/passwd", options)
            .unwrap();
        writer.finish().unwrap();
        let dest = dir.join("out");
        fs::create_dir_all(&dest).unwrap();

        assert!(extract_archive(&archive, &dest).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_archives_with_too_many_entries() {
        let dir = temp_dir("bomb");
        let archive = dir.join("many.zip");
        let entries: Vec<(String, String)> = (0..=MAX_ARCHIVE_ENTRIES)
            .map(|index| (format!("my-skill/file-{index}.txt"), "x".to_string()))
            .collect();
        let refs: Vec<(&str, &str)> = entries
            .iter()
            .map(|(name, body)| (name.as_str(), body.as_str()))
            .collect();
        write_zip(&archive, &refs);
        let dest = dir.join("out");
        fs::create_dir_all(&dest).unwrap();

        assert!(extract_archive(&archive, &dest).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_entries_over_the_size_limit() {
        let dir = temp_dir("huge");
        let archive = dir.join("huge.zip");
        let big = "x".repeat((MAX_ARCHIVE_ENTRY_BYTES + 1) as usize);
        write_zip(&archive, &[("my-skill/huge.bin", &big)]);
        let dest = dir.join("out");
        fs::create_dir_all(&dest).unwrap();

        assert!(extract_archive(&archive, &dest).is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_files_that_are_not_archives() {
        let dir = temp_dir("plain");
        let file = dir.join("notes.txt");
        fs::write(&file, "not a zip").unwrap();
        let dest = dir.join("out");
        fs::create_dir_all(&dest).unwrap();

        assert!(extract_archive(&file, &dest).is_err());
        let _ = fs::remove_dir_all(&dir);
    }
}
