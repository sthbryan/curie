use super::lock::load_skill_lock;
use super::scope::Scope;
use super::types::{GitTreeResponse, SkillLockEntry, SkillUpdateInfo};
use std::collections::HashMap;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

const TREE_CACHE_TTL: Duration = Duration::from_secs(120);
const REQUEST_TIMEOUT: Duration = Duration::from_secs(7);
/// Each source is a separate GitHub round trip, so a few run side by side.
const CHECK_WORKERS: usize = 4;

type TreeCache = HashMap<String, (Instant, GitTreeResponse)>;

fn tree_cache() -> &'static Mutex<TreeCache> {
    static CACHE: OnceLock<Mutex<TreeCache>> = OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn cached_tree(key: &str) -> Option<GitTreeResponse> {
    let cache = tree_cache().lock().ok()?;
    let (stored_at, tree) = cache.get(key)?;
    (stored_at.elapsed() < TREE_CACHE_TTL).then(|| tree.clone())
}

fn store_tree(key: String, tree: &GitTreeResponse) {
    if let Ok(mut cache) = tree_cache().lock() {
        cache.retain(|_, (stored_at, _)| stored_at.elapsed() < TREE_CACHE_TTL);
        cache.insert(key, (Instant::now(), tree.clone()));
    }
}

pub(crate) fn skill_folder_path(skill_path: &str) -> String {
    let mut path = skill_path.replace('\\', "/");
    let lower = path.to_ascii_lowercase();
    if lower.ends_with("/skill.md") {
        path.truncate(path.len().saturating_sub(9));
    } else if lower.ends_with("skill.md") {
        path.truncate(path.len().saturating_sub(8));
    }
    while path.ends_with('/') {
        path.pop();
    }
    path
}

fn github_token() -> Option<String> {
    std::env::var("GITHUB_TOKEN")
        .or_else(|_| std::env::var("GH_TOKEN"))
        .ok()
        .filter(|t| !t.trim().is_empty())
}

/// One pool for every GitHub read in this module: connections and TLS state
/// are reused instead of rebuilt for each of the four parallel checks.
fn http_agent() -> &'static ureq::Agent {
    static AGENT: OnceLock<ureq::Agent> = OnceLock::new();
    AGENT.get_or_init(|| {
        ureq::Agent::config_builder()
            .timeout_global(Some(REQUEST_TIMEOUT))
            // A rate-limited reply still carries the header that tells us to stop.
            .http_status_as_error(false)
            .build()
            .into()
    })
}

fn encode_path_segment(segment: &str) -> String {
    let mut out = String::with_capacity(segment.len());
    for b in segment.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char);
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

pub(crate) fn fetch_github_tree(
    owner_repo: &str,
    r#ref: Option<&str>,
    fresh: bool,
) -> Option<GitTreeResponse> {
    let cache_key = format!("{owner_repo}#{}", r#ref.unwrap_or(""));
    if !fresh {
        if let Some(tree) = cached_tree(&cache_key) {
            return Some(tree);
        }
    }

    let branches: Vec<&str> = if let Some(r) = r#ref.filter(|s| !s.is_empty()) {
        vec![r]
    } else {
        vec!["HEAD", "main", "master"]
    };

    let token = github_token();
    let agent = http_agent();

    for branch in branches {
        let url = format!(
            "https://api.github.com/repos/{}/git/trees/{}?recursive=1",
            owner_repo,
            encode_path_segment(branch)
        );

        let mut req = agent
            .get(&url)
            .header("Accept", "application/vnd.github.v3+json")
            .header("User-Agent", "curie-skills-manager");

        if let Some(ref t) = token {
            req = req.header("Authorization", &format!("Bearer {t}"));
        }

        match req.call() {
            Ok(mut resp) => {
                if resp.status().is_success() {
                    if let Ok(tree) = resp.body_mut().read_json::<GitTreeResponse>() {
                        store_tree(cache_key, &tree);
                        return Some(tree);
                    }
                } else if resp.status().as_u16() == 403 {
                    let remaining = resp
                        .headers()
                        .get("x-ratelimit-remaining")
                        .and_then(|value| value.to_str().ok())
                        .unwrap_or("?");
                    if remaining == "0" {
                        break;
                    }
                }
            }
            Err(_) => continue,
        }
    }

    None
}

pub(crate) fn latest_folder_hash(tree: &GitTreeResponse, skill_path: &str) -> Option<String> {
    let folder = skill_folder_path(skill_path);
    if folder.is_empty() {
        return Some(tree.sha.clone());
    }
    tree.tree
        .iter()
        .find(|e| e.entry_type == "tree" && e.path == folder)
        .map(|e| e.sha.clone())
}

fn is_github_entry(entry: &SkillLockEntry) -> bool {
    entry
        .source_type
        .as_deref()
        .map(|t| t.eq_ignore_ascii_case("github"))
        .unwrap_or(false)
        || entry
            .source
            .as_deref()
            .map(|s| s.contains('/') && !s.contains("://"))
            .unwrap_or(false)
}

/// `owner/repo` for a lock entry whose source is a GitHub URL as well as a
/// shorthand; the tree API only understands the shorthand shape.
fn github_repo(raw: &str) -> Option<String> {
    let raw = raw.trim();
    if raw.is_empty() {
        return None;
    }
    if raw.contains("://") || raw.starts_with("git@") || raw.starts_with("ssh://") {
        let Ok(super::source::Source::Git(git)) = super::source::parse_source(raw) else {
            return None;
        };
        return git.owner_repo.filter(|repo| !repo.is_empty());
    }
    let repo = raw.trim_end_matches(".git").trim_end_matches('/');
    (repo.matches('/').count() == 1 && !repo.chars().any(char::is_whitespace))
        .then(|| repo.to_string())
}

fn resolve_github_source(entry: &SkillLockEntry) -> Option<String> {
    entry
        .source
        .as_deref()
        .and_then(github_repo)
        .or_else(|| entry.source_url.as_deref().and_then(github_repo))
}

pub fn check_skill_updates_in(scope: &Scope, fresh: bool) -> Result<Vec<SkillUpdateInfo>, String> {
    let lock = load_skill_lock(scope);
    if lock.skills.is_empty() {
        return Ok(Vec::new());
    }

    // Group checkable GitHub skills by source and ref: one tree fetch covers
    // every skill installed from the same repository at the same revision.
    let mut by_source: HashMap<(String, String), Vec<(String, SkillLockEntry)>> = HashMap::new();
    let mut results: Vec<SkillUpdateInfo> = Vec::new();

    for (name, entry) in &lock.skills {
        let has_hash = entry
            .skill_folder_hash
            .as_ref()
            .map(|h| !h.is_empty())
            .unwrap_or(false);
        let has_path = entry
            .skill_path
            .as_ref()
            .map(|p| !p.is_empty())
            .unwrap_or(false);

        if !has_hash || !has_path || !is_github_entry(entry) {
            results.push(SkillUpdateInfo {
                name: name.clone(),
                source: entry.source.clone(),
                update_available: false,
                checkable: false,
                checked: false,
            });
            continue;
        }

        let Some(source) = resolve_github_source(entry) else {
            results.push(SkillUpdateInfo {
                name: name.clone(),
                source: entry.source.clone(),
                update_available: false,
                checkable: false,
                checked: false,
            });
            continue;
        };

        let group = (source, entry.r#ref.clone().unwrap_or_default());
        by_source.entry(group).or_default().push((name.clone(), entry.clone()));
    }

    let sources: Vec<((String, String), Vec<(String, SkillLockEntry)>)> =
        by_source.into_iter().collect();
    let results: Mutex<Vec<SkillUpdateInfo>> = Mutex::new(Vec::new());
    let next = AtomicUsize::new(0);

    std::thread::scope(|scope| {
        for _ in 0..CHECK_WORKERS.min(sources.len()) {
            scope.spawn(|| loop {
                let index = next.fetch_add(1, Ordering::Relaxed);
                let Some(((source, _), items)) = sources.get(index) else {
                    break;
                };
                let checked = check_source(source, items, fresh);
                if let Ok(mut results) = results.lock() {
                    results.extend(checked);
                }
            });
        }
    });

    let mut results = results.into_inner().unwrap_or_default();
    results.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(results)
}

fn check_source(
    source: &str,
    items: &[(String, SkillLockEntry)],
    fresh: bool,
) -> Vec<SkillUpdateInfo> {
    let ref_hint = items.first().and_then(|(_, entry)| entry.r#ref.as_deref());
    let tree = fetch_github_tree(source, ref_hint, fresh);

    items
        .iter()
        .map(|(name, entry)| {
            let Some(tree) = tree.as_ref() else {
                return SkillUpdateInfo {
                    name: name.clone(),
                    source: Some(source.to_string()),
                    update_available: false,
                    checkable: true,
                    checked: false,
                };
            };

            let skill_path = entry.skill_path.as_deref().unwrap_or("");
            let local_hash = entry.skill_folder_hash.as_deref().unwrap_or("");
            let latest = latest_folder_hash(tree, skill_path);

            SkillUpdateInfo {
                name: name.clone(),
                source: Some(source.to_string()),
                update_available: latest.as_deref().map(|h| h != local_hash).unwrap_or(false),
                checkable: true,
                checked: latest.is_some(),
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::skills::types::GitTreeEntry;

    #[test]
    fn skill_folder_path_strips_skill_md() {
        assert_eq!(
            skill_folder_path("skills/taste-skill/SKILL.md"),
            "skills/taste-skill"
        );
        assert_eq!(
            skill_folder_path(".agents/skills/impeccable/SKILL.md"),
            ".agents/skills/impeccable"
        );
        assert_eq!(
            skill_folder_path("nothing-design/skill.md"),
            "nothing-design"
        );
        assert_eq!(skill_folder_path("SKILL.md"), "");
    }

    #[test]
    fn latest_folder_hash_matches_tree_entry() {
        let tree = GitTreeResponse {
            sha: "root".into(),
            tree: vec![
                GitTreeEntry {
                    path: "skills/taste-skill".into(),
                    entry_type: "tree".into(),
                    sha: "abc123".into(),
                },
                GitTreeEntry {
                    path: "skills/taste-skill/SKILL.md".into(),
                    entry_type: "blob".into(),
                    sha: "blob".into(),
                },
            ],
        };
        assert_eq!(
            latest_folder_hash(&tree, "skills/taste-skill/SKILL.md").as_deref(),
            Some("abc123")
        );
        assert_eq!(latest_folder_hash(&tree, "missing/SKILL.md"), None);
        assert_eq!(
            latest_folder_hash(&tree, "SKILL.md").as_deref(),
            Some("root")
        );
    }

    fn sample_tree(sha: &str) -> GitTreeResponse {
        GitTreeResponse {
            sha: sha.into(),
            tree: vec![GitTreeEntry {
                path: "skills/one".into(),
                entry_type: "tree".into(),
                sha: "hash".into(),
            }],
        }
    }

    #[test]
    fn a_stored_tree_is_served_from_the_cache() {
        let key = format!("owner/repo-hit-{}#", std::process::id());
        store_tree(key.clone(), &sample_tree("cached"));

        assert_eq!(cached_tree(&key).unwrap().sha, "cached");
    }

    #[test]
    fn an_unknown_repo_is_a_cache_miss() {
        let key = format!("owner/repo-miss-{}#", std::process::id());

        assert!(cached_tree(&key).is_none());
    }

    #[test]
    fn a_ref_gets_its_own_cache_entry() {
        let base = format!("owner/repo-ref-{}", std::process::id());
        store_tree(format!("{base}#"), &sample_tree("head"));
        store_tree(format!("{base}#v2"), &sample_tree("tagged"));

        assert_eq!(cached_tree(&format!("{base}#")).unwrap().sha, "head");
        assert_eq!(cached_tree(&format!("{base}#v2")).unwrap().sha, "tagged");
    }

    #[test]
    fn a_stored_url_resolves_to_the_repo_the_tree_api_needs() {
        assert_eq!(github_repo("one/url").as_deref(), Some("one/url"));
        assert_eq!(
            github_repo("https://github.com/one/url").as_deref(),
            Some("one/url")
        );
        assert_eq!(
            github_repo("https://github.com/one/url.git").as_deref(),
            Some("one/url")
        );
        assert_eq!(github_repo("https://gitlab.com/one/url"), None);
        assert_eq!(github_repo("some/local/folder"), None);
    }

    #[test]
    fn a_lock_entry_that_only_records_the_url_is_still_checked() {
        let root = std::env::temp_dir().join(format!("curie-url-check-{}", std::process::id()));
        std::fs::create_dir_all(&root).expect("temp dir");
        let lock = serde_json::json!({
            "skills": {
                "url-skill": {
                    "sourceType": "github",
                    "sourceUrl": "https://github.com/one/url",
                    "skillPath": "skills/url-skill/SKILL.md",
                    "skillFolderHash": "old",
                },
            }
        });
        std::fs::write(root.join("skills-lock.json"), lock.to_string()).expect("lockfile");
        store_tree(
            "one/url#".to_string(),
            &GitTreeResponse {
                sha: "root".into(),
                tree: vec![GitTreeEntry {
                    path: "skills/url-skill".into(),
                    entry_type: "tree".into(),
                    sha: "new".into(),
                }],
            },
        );

        let rows = check_skill_updates_in(&Scope::Project(root.clone()), false).expect("check");
        let _ = std::fs::remove_dir_all(&root);

        assert_eq!(rows.len(), 1);
        assert!(rows[0].checked);
        assert!(rows[0].update_available);
    }

    #[test]
    fn checks_every_source_from_the_cache_across_workers() {
        let root = std::env::temp_dir().join(format!("curie-updates-{}", std::process::id()));
        std::fs::create_dir_all(&root).expect("temp dir");
        let lock = serde_json::json!({
            "skills": {
                "alpha": {
                    "source": "one/alpha",
                    "sourceType": "github",
                    "skillPath": "skills/alpha/SKILL.md",
                    "skillFolderHash": "old-alpha",
                },
                "beta": {
                    "source": "two/beta",
                    "sourceType": "github",
                    "skillPath": "skills/beta/SKILL.md",
                    "skillFolderHash": "old-beta",
                },
            }
        });
        std::fs::write(root.join("skills-lock.json"), lock.to_string()).expect("lockfile");

        for (source, path, sha) in [
            ("one/alpha", "skills/alpha", "new-alpha"),
            ("two/beta", "skills/beta", "new-beta"),
        ] {
            store_tree(
                format!("{source}#"),
                &GitTreeResponse {
                    sha: "root".into(),
                    tree: vec![GitTreeEntry {
                        path: path.into(),
                        entry_type: "tree".into(),
                        sha: sha.into(),
                    }],
                },
            );
        }

        let rows = check_skill_updates_in(&Scope::Project(root.clone()), false).expect("check");
        let _ = std::fs::remove_dir_all(&root);

        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].name, "alpha");
        assert_eq!(rows[1].name, "beta");
        assert!(rows.iter().all(|row| row.checkable && row.checked));
        assert!(rows.iter().all(|row| row.update_available));
    }

    #[test]
    fn an_expired_entry_is_not_served() {
        let key = format!("owner/repo-stale-{}#", std::process::id());
        if let Ok(mut cache) = tree_cache().lock() {
            let stale = Instant::now() - TREE_CACHE_TTL - Duration::from_secs(1);
            cache.insert(key.clone(), (stale, sample_tree("stale")));
        }

        assert!(cached_tree(&key).is_none());
    }
}
