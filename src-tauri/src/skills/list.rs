use super::scan::scan_skills;
use super::scope::Scope;
use super::types::SkillInfo;

pub fn list_skills_in(scope: &Scope) -> Result<Vec<SkillInfo>, String> {
    Ok(scan_skills(scope))
}
