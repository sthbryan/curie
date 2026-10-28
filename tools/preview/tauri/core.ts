import {
  APP_UPDATE,
  EXPLORE,
  FIND,
  NODE,
  NOT_INSTALLED,
  PLAN,
  PROJECTS,
  SKILLS,
  UPDATES,
} from "../fixtures";

const params = new URLSearchParams(location.search);
const setup = params.get("setup") === "1";
// `hang=1` keeps the setup screen in its running phase, which is the only way
// to inspect the step list without a real install.
const hang = params.get("hang") === "1";

export async function invoke(command: string): Promise<unknown> {
  switch (command) {
    case "get_locale":
      return "en";
    case "detect_node":
      return setup ? NOT_INSTALLED : NODE;
    case "plan_node_setup":
      return PLAN;
    case "install_node":
      return hang ? new Promise(() => {}) : NODE;
    case "list_skills":
      return SKILLS;
    case "check_skill_updates":
      return UPDATES;
    case "read_projects":
      return PROJECTS;
    case "check_app_update":
      return APP_UPDATE;
    case "explore_skills":
      return { skills: EXPLORE, total: 300, hasMore: true, page: 0, view: "hot" };
    case "find_skills":
      return FIND;
    case "read_settings":
    case "write_settings":
    case "write_projects":
    case "show_main_window":
      return null;
    default:
      console.info("[preview] unhandled command:", command);
      return null;
  }
}
