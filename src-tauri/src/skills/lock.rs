use super::types::SkillLockFile;

pub(crate) fn load_skill_lock() -> SkillLockFile {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return SkillLockFile::default(),
    };

    let candidates = [
        home.join(".agents").join(".skill-lock.json"),
        home.join(".skill-lock.json"),
        home.join("skills-lock.json"),
    ];

    for path in candidates {
        if let Ok(raw) = std::fs::read_to_string(&path) {
            if let Ok(lock) = serde_json::from_str::<SkillLockFile>(&raw) {
                return lock;
            }
        }
    }

    SkillLockFile::default()
}
