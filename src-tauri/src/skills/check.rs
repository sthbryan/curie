use super::lock::load_skill_lock;
use super::scope::Scope;
use super::types::{GitTreeResponse, SkillLockEntry, SkillUpdateInfo};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

const TREE_CACHE_TTL: Duration = Duration::from_secs(300);

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

fn fetch_github_tree(owner_repo: &str, r#ref: Option<&str>) -> Option<GitTreeResponse> {
    let cache_key = format!("{owner_repo}#{}", r#ref.unwrap_or(""));
    if let Some(tree) = cached_tree(&cache_key) {
        return Some(tree);
    }

    let branches: Vec<&str> = if let Some(r) = r#ref.filter(|s| !s.is_empty()) {
        vec![r]
    } else {
        vec!["HEAD", "main", "master"]
    };

    let token = github_token();
    let agent = ureq::AgentBuilder::new()
        .timeout(std::time::Duration::from_secs(10))
        .build();

    for branch in branches {
        let url = format!(
            "https://api.github.com/repos/{}/git/trees/{}?recursive=1",
            owner_repo,
            encode_path_segment(branch)
        );

        let mut req = agent
            .get(&url)
            .set("Accept", "application/vnd.github.v3+json")
            .set("User-Agent", "curie-skills-manager");

        if let Some(ref t) = token {
            req = req.set("Authorization", &format!("Bearer {t}"));
        }

        match req.call() {
            Ok(resp) => {
                if let Ok(tree) = resp.into_json::<GitTreeResponse>() {
                    store_tree(cache_key, &tree);
                    return Some(tree);
                }
            }
            Err(ureq::Error::Status(403, resp)) => {
                let remaining = resp.header("x-ratelimit-remaining").unwrap_or("?");
                if remaining == "0" {
                    break;
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

fn resolve_github_source(entry: &SkillLockEntry) -> Option<String> {
    entry
        .source
        .clone()
        .or_else(|| {
            entry.source_url.as_ref().and_then(|url| {
                url.trim_end_matches(".git")
                    .trim_end_matches('/')
                    .rsplit_once("github.com/")
                    .map(|(_, rest)| rest.to_string())
            })
        })
        .filter(|s| !s.is_empty())
}

pub fn check_skill_updates_in(scope: &Scope) -> Result<Vec<SkillUpdateInfo>, String> {
    let lock = load_skill_lock(scope);
    if lock.skills.is_empty() {
        return Ok(Vec::new());
    }

    // Group checkable GitHub skills by source (one tree fetch per repo).
    let mut by_source: HashMap<String, Vec<(String, SkillLockEntry)>> = HashMap::new();
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

        by_source
            .entry(source)
            .or_default()
            .push((name.clone(), entry.clone()));
    }

    for (source, items) in by_source {
        let ref_hint = items
            .first()
            .and_then(|(_, e)| e.r#ref.as_deref())
            .map(|s| s.to_string());
        let tree = fetch_github_tree(&source, ref_hint.as_deref());

        for (name, entry) in items {
            let Some(tree) = tree.as_ref() else {
                results.push(SkillUpdateInfo {
                    name,
                    source: Some(source.clone()),
                    update_available: false,
                    checkable: true,
                    checked: false,
                });
                continue;
            };

            let skill_path = entry.skill_path.as_deref().unwrap_or("");
            let local_hash = entry.skill_folder_hash.as_deref().unwrap_or("");
            let latest = latest_folder_hash(tree, skill_path);

            results.push(SkillUpdateInfo {
                name,
                source: Some(source.clone()),
                update_available: latest.as_deref().map(|h| h != local_hash).unwrap_or(false),
                checkable: true,
                checked: latest.is_some(),
            });
        }
    }

    results.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(results)
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
    fn an_expired_entry_is_not_served() {
        let key = format!("owner/repo-stale-{}#", std::process::id());
        if let Ok(mut cache) = tree_cache().lock() {
            let stale = Instant::now() - TREE_CACHE_TTL - Duration::from_secs(1);
            cache.insert(key.clone(), (stale, sample_tree("stale")));
        }

        assert!(cached_tree(&key).is_none());
    }
}
