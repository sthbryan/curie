use super::types::{ExploreApiResponse, ExplorePage, SkillExploreResult};

const SEARCH_API_BASE: &str = "https://skills.sh";
const VALID_VIEWS: &[&str] = &["hot", "trending", "all-time"];

pub fn explore_skills(view: &str, page: u32) -> Result<ExplorePage, String> {
    let view = view.trim();
    if !VALID_VIEWS.contains(&view) {
        return Err(format!(
            "invalid explore view '{view}'; use one of: {}",
            VALID_VIEWS.join(", ")
        ));
    }

    let url = format!("{SEARCH_API_BASE}/api/skills/{view}/{page}");

    let config = ureq::Agent::config_builder()
        .timeout_global(Some(std::time::Duration::from_secs(20)))
        .build();
    let agent: ureq::Agent = config.into();

    let mut resp = agent
        .get(&url)
        .header("Accept", "application/json")
        .header("User-Agent", "curie-skills-manager")
        .call()
        .map_err(|e| format!("skills explore failed: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!(
            "skills explore returned HTTP {}",
            resp.status().as_u16()
        ));
    }

    let body: ExploreApiResponse = resp
        .body_mut()
        .read_json()
        .map_err(|e| format!("Failed to parse explore response: {e}"))?;

    let skills: Vec<SkillExploreResult> = body
        .skills
        .into_iter()
        .map(|s| {
            let source = s.source.trim().to_string();
            let name = if s.name.trim().is_empty() {
                s.skill_id.clone()
            } else {
                s.name
            };
            let id = if source.is_empty() {
                name.clone()
            } else {
                format!("{source}/{name}")
            };
            let package = if source.is_empty() {
                name.clone()
            } else {
                format!("{source}@{name}")
            };
            let url = format!("{SEARCH_API_BASE}/{id}");
            SkillExploreResult {
                id,
                name,
                source,
                installs: s.installs,
                package,
                url,
                installs_yesterday: s.installs_yesterday,
                change: s.change,
                is_official: s.is_official.unwrap_or(false),
            }
        })
        .collect();

    Ok(ExplorePage {
        skills,
        total: body.total,
        has_more: body.has_more,
        page: body.page.unwrap_or(page),
        view: view.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_invalid_view() {
        let err = explore_skills("nope", 0).unwrap_err();
        assert!(err.contains("invalid explore view"));
    }
}
