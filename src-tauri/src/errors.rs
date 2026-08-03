use std::fmt::Display;

pub const DETAIL_SEP: char = '\u{1f}';

pub fn coded(key: &str) -> String {
    format!("errors.{key}")
}

pub fn coded_with(key: &str, detail: impl Display) -> String {
    format!("errors.{key}{DETAIL_SEP}{detail}")
}

pub mod key {
    pub const HOME_MISSING: &str = "homeMissing";
    pub const PATH_INVALID: &str = "pathInvalid";
    pub const DIR_CREATE_FAILED: &str = "dirCreateFailed";
    pub const READ_FAILED: &str = "readFailed";
    pub const WRITE_FAILED: &str = "writeFailed";
    pub const SAVE_FAILED: &str = "saveFailed";
    pub const ENCODE_FAILED: &str = "encodeFailed";
    pub const TASK_FAILED: &str = "taskFailed";

    pub const PROJECT_PATH_REQUIRED: &str = "projectPathRequired";
    pub const PROJECT_PATH_INVALID: &str = "projectPathInvalid";
    pub const PROJECT_PATH_NOT_ABSOLUTE: &str = "projectPathNotAbsolute";
    pub const PROJECT_FOLDER_MISSING: &str = "projectFolderMissing";
    pub const PROJECT_NOT_A_FOLDER: &str = "projectNotAFolder";

    pub const PACKAGE_REQUIRED: &str = "packageRequired";
    pub const PACKAGE_INVALID: &str = "packageInvalid";
    pub const SKILL_NAME_REQUIRED: &str = "skillNameRequired";
    pub const SKILL_NAME_INVALID: &str = "skillNameInvalid";
    pub const SKILL_CONTENT_EMPTY: &str = "skillContentEmpty";
    pub const SKILL_ADD_FAILED: &str = "skillAddFailed";
    pub const SKILLS_LIST_NOT_JSON: &str = "skillsListNotJson";
    pub const SKILLS_LIST_PARSE_FAILED: &str = "skillsListParseFailed";

    pub const NOT_MARKDOWN: &str = "notMarkdown";
    pub const NOT_A_FILE: &str = "notAFile";
    pub const FILE_TOO_LARGE: &str = "fileTooLarge";

    pub const RELEASE_FETCH_FAILED: &str = "releaseFetchFailed";
    pub const RELEASE_PARSE_FAILED: &str = "releaseParseFailed";
    pub const UPDATER_INIT_FAILED: &str = "updaterInitFailed";
    pub const UPDATER_CHECK_FAILED: &str = "updaterCheckFailed";
    pub const UPDATE_INSTALL_FAILED: &str = "updateInstallFailed";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn coded_uses_the_i18n_namespace() {
        assert_eq!(coded(key::HOME_MISSING), "errors.homeMissing");
    }

    #[test]
    fn detail_is_separated_by_the_unit_separator() {
        let out = coded_with(key::READ_FAILED, "/tmp/a.md");
        assert_eq!(out, format!("errors.readFailed{DETAIL_SEP}/tmp/a.md"));
        let mut parts = out.split(DETAIL_SEP);
        assert_eq!(parts.next(), Some("errors.readFailed"));
        assert_eq!(parts.next(), Some("/tmp/a.md"));
    }

    #[test]
    fn keys_are_unique() {
        let all = [
            key::HOME_MISSING,
            key::PATH_INVALID,
            key::DIR_CREATE_FAILED,
            key::READ_FAILED,
            key::WRITE_FAILED,
            key::SAVE_FAILED,
            key::ENCODE_FAILED,
            key::TASK_FAILED,
            key::PROJECT_PATH_REQUIRED,
            key::PROJECT_PATH_INVALID,
            key::PROJECT_PATH_NOT_ABSOLUTE,
            key::PROJECT_FOLDER_MISSING,
            key::PROJECT_NOT_A_FOLDER,
            key::PACKAGE_REQUIRED,
            key::PACKAGE_INVALID,
            key::SKILL_NAME_REQUIRED,
            key::SKILL_NAME_INVALID,
            key::SKILL_CONTENT_EMPTY,
            key::SKILL_ADD_FAILED,
            key::SKILLS_LIST_NOT_JSON,
            key::SKILLS_LIST_PARSE_FAILED,
            key::NOT_MARKDOWN,
            key::NOT_A_FILE,
            key::FILE_TOO_LARGE,
            key::RELEASE_FETCH_FAILED,
            key::RELEASE_PARSE_FAILED,
            key::UPDATER_INIT_FAILED,
            key::UPDATER_CHECK_FAILED,
            key::UPDATE_INSTALL_FAILED,
        ];
        let mut seen = std::collections::HashSet::new();
        for k in all {
            assert!(seen.insert(k), "duplicate error key: {k}");
        }
    }
}
