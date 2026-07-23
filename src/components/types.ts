export type ThemeMode = "dark" | "light" | "rose" | "dawn";
export type ReducedMotionPref = "system" | "true" | "false";
export type View = "home" | "installed" | "marketplace" | "search" | "settings";

export const REDUCED_MOTION_OPTIONS: ReducedMotionPref[] = ["system", "true", "false"];

export type NodeInfo = {
  installed: boolean;
  version: string | null;
  path: string | null;
  manager: string | null;
};

export type SkillInfo = {
  name: string;
  path: string;
  scope: string;
  agents: string[];
  source: string | null;
  sourceUrl: string | null;
  sourceType: string | null;
  installedAt: string | null;
  updatedAt: string | null;
};

export type SkillUpdateInfo = {
  name: string;
  source: string | null;
  updateAvailable: boolean;
  checkable: boolean;
};

export type SkillUpdateResult = {
  updated: string[];
  message: string;
};

export type SkillSearchResult = {
  id: string;
  name: string;
  source: string;
  installs: number;
  package: string;
  url: string;
};

export type SkillInstallResult = {
  package: string;
  message: string;
};

export type SkillRemoveResult = {
  removed: string[];
  message: string;
};

export type AgentSummary = {
  id: string;
  label: string;
  count: number;
};

export type Activity = {
  kind: "install" | "update";
  skill: string;
  source: string | null;
  when: string;
  at: string;
};

export type Stage = "loading" | "setup" | "installing" | "done" | "error" | "home";

export type InstallStep = "checking" | "download" | "node" | "done" | "error";

export const STEP_ORDER: InstallStep[] = ["checking", "download", "node", "done"];

export type ProgressEvent = {
  stage: string;
  message: string;
  done: boolean;
};

export const THEME_OPTIONS: {
  id: ThemeMode;
  swatches: [string, string, string];
}[] = [
  { id: "dark", swatches: ["#0a0a0a", "#f5f5f3", "#d71921"] },
  { id: "light", swatches: ["#fafaf8", "#18181b", "#c2151c"] },
  { id: "rose", swatches: ["#191724", "#e0def4", "#eb6f92"] },
  { id: "dawn", swatches: ["#faf4ed", "#575279", "#b4637a"] },
];
