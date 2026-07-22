export type ThemeMode = "dark" | "light";
export type View = "home" | "installed" | "marketplace" | "search" | "settings";

export type Agent = {
  id: string;
  label: string;
  count: number;
  capacity: number;
  status: "current" | "updates";
  updates: number;
};

export const AGENTS: Agent[] = [
  { id: "claude", label: "claude-code", count: 9, capacity: 12, status: "updates", updates: 3 },
  { id: "cursor", label: "cursor", count: 6, capacity: 12, status: "current", updates: 0 },
  { id: "opencode", label: "opencode", count: 4, capacity: 12, status: "current", updates: 0 },
];

export type Activity = {
  kind: "install" | "update" | "remove";
  skill: string;
  agent: string;
  when: string;
};

export const RECENT: Activity[] = [
  { kind: "install", skill: "skill-creator", agent: "claude-code", when: "2h ago" },
  { kind: "install", skill: "web-design-guidelines", agent: "claude-code", when: "yesterday" },
  { kind: "update", skill: "react-patterns", agent: "cursor", when: "yesterday" },
  { kind: "install", skill: "figma-tokens", agent: "opencode", when: "3 days ago" },
];

export const TOTAL_SKILLS = 12;
export const TOTAL_UPDATES = 3;
export const ACTIVE_AGENTS = AGENTS.filter((a) => a.count > 0).length;

export type NodeInfo = {
  installed: boolean;
  version: string | null;
  path: string | null;
  manager: string | null;
};

export type Stage = "loading" | "setup" | "installing" | "done" | "error" | "home";

export type InstallStep = "checking" | "download" | "node" | "done" | "error";

export const STEP_ORDER: InstallStep[] = ["checking", "download", "node", "done"];

export type ProgressEvent = {
  stage: string;
  message: string;
  done: boolean;
};
