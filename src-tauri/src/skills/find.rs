use super::types::{SearchApiResponse, SkillSearchResult};

const SEARCH_API_BASE: &str = "https://skills.sh";
const DEFAULT_LIMIT: u32 = 20;
const MIN_QUERY_LEN: usize = 2;

pub fn find_skills(query: &str, owner: Option<&str>) -> Result<Vec<SkillSearchResult>, String> {
    let q = query.trim();
    if q.len() < MIN_QUERY_LEN {
        return Ok(Vec::new());
    }

    let owner = owner
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_ascii_lowercase());

    if let Some(ref o) = owner {
        if !is_valid_github_owner(o) {
            return Err("--owner must be a valid GitHub owner".into());
        }
    }

    let mut url = format!(
        "{SEARCH_API_BASE}/api/search?q={}&limit={DEFAULT_LIMIT}",
        urlencoding_encode(q)
    );
    if let Some(ref o) = owner {
        url.push_str("&owner=");
        url.push_str(&urlencoding_encode(o));
    }

    let agent = ureq::AgentBuilder::new()
        .timeout(std::time::Duration::from_secs(15))
        .build();

    let resp = agent
        .get(&url)
        .set("Accept", "application/json")
        .set("User-Agent", "curie-skills-manager")
        .call()
        .map_err(|e| format!("skills search failed: {e}"))?;

    if resp.status() < 200 || resp.status() >= 300 {
        return Err(format!("skills search returned HTTP {}", resp.status()));
    }

    let body: SearchApiResponse = resp
        .into_json()
        .map_err(|e| format!("Failed to parse search response: {e}"))?;

    let mut results: Vec<SkillSearchResult> = body
        .skills
        .into_iter()
        .map(|s| {
            let source = s.source.trim().to_string();
            let package = if source.is_empty() {
                s.name.clone()
            } else {
                format!("{}@{}", source, s.name)
            };
            let url = format!("{SEARCH_API_BASE}/{}", s.id.trim_start_matches('/'));
            SkillSearchResult {
                id: s.id,
                name: s.name,
                source,
                installs: s.installs,
                package,
                url,
            }
        })
        .collect();

    results.sort_by(|a, b| {
        b.installs
            .cmp(&a.installs)
            .then_with(|| a.name.cmp(&b.name))
    });
    Ok(results)
}

fn is_valid_github_owner(owner: &str) -> bool {
    if owner.is_empty() || owner.len() > 39 {
        return false;
    }
    let bytes = owner.as_bytes();
    if !bytes[0].is_ascii_alphanumeric() {
        return false;
    }
    bytes
        .iter()
        .all(|b| b.is_ascii_alphanumeric() || *b == b'-')
}

fn urlencoding_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char);
            }
            b' ' => out.push_str("%20"),
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn short_query_returns_empty() {
        let r = find_skills("a", None).expect("ok");
        assert!(r.is_empty());
    }

    #[test]
    fn rejects_bad_owner() {
        let err = find_skills("react", Some("bad owner!!")).unwrap_err();
        assert!(err.contains("owner"));
    }

    #[test]
    fn encodes_spaces() {
        assert_eq!(urlencoding_encode("web design"), "web%20design");
        assert_eq!(urlencoding_encode("a/b"), "a%2Fb");
    }
}
