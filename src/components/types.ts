import type { Lang } from "@/i18n";

export type ThemeMode = "dark" | "rose" | "nord" | "ember" | "light" | "dawn" | "snow" | "sand";
export type ReducedMotionPref = "user" | "always" | "never";
export type View = "home" | "installed" | "marketplace" | "search" | "settings";

export type AppUpdateInfo = {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  releaseNotes: string | null;
};

export type InstallResult = {
  success: boolean;
  message: string;
  fallbackUrl: string | null;
};

export const REDUCED_MOTION_OPTIONS: ReducedMotionPref[] = ["user", "always", "never"];

export type Settings = {
  version: number;
  theme: ThemeMode;
  lang: Lang;
  reducedMotion: ReducedMotionPref;
  hasBooted: boolean;
};

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

export type Project = {
  id: string;
  name: string;
  path: string;
  addedAt: string;
};

export type ProjectProbe = {
  path: string;
  name: string;
  exists: boolean;
  isDir: boolean;
  isReserved: boolean;
};

export type ProjectSummary = {
  count: number;
  agents: string[];
  missing: boolean;
  error: string | null;
};

export type Scope = { kind: "global" } | { kind: "project"; project: Project };

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

export type ExploreView = "hot" | "trending" | "all-time";

export type SkillExploreResult = {
  id: string;
  name: string;
  source: string;
  installs: number;
  package: string;
  url: string;
  installsYesterday: number | null;
  change: number | null;
  isOfficial: boolean;
};

export type ExplorePage = {
  skills: SkillExploreResult[];
  total: number;
  hasMore: boolean;
  page: number;
  view: string;
};

export type SkillInstallResult = {
  package: string;
  message: string;
};

export type DetectedSkill = {
  name: string;
  description: string;
};

export type SkillDetection = {
  isSkill: boolean;
  total: number;
  truncated: boolean;
  skills: DetectedSkill[];
  refUsed: string | null;
};

export type SkillRemoveResult = {
  removed: string[];
  message: string;
};

export type CustomSkillInstallResult = {
  name: string;
  path: string;
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
  at: string;
};

export type Stage = "loading" | "setup" | "installing" | "done" | "error" | "home";

export type SetupStep = "check" | "volta" | "node" | "verify" | "done";

export type NodeManager = {
  id: string;
  path: string;
};

export type SetupPlan = {
  node: NodeInfo;
  manager: NodeManager | null;
  steps: SetupStep[];
  command: string;
};

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
  { id: "rose", swatches: ["#191724", "#e0def4", "#eb6f92"] },
  { id: "nord", swatches: ["#2e3440", "#eceff4", "#88c0d0"] },
  { id: "ember", swatches: ["#282828", "#fbf1c7", "#fe8019"] },
  { id: "light", swatches: ["#fafaf8", "#18181b", "#c2151c"] },
  { id: "dawn", swatches: ["#faf4ed", "#575279", "#b4637a"] },
  { id: "snow", swatches: ["#eceff4", "#2e3440", "#456590"] },
  { id: "sand", swatches: ["#fbf1c7", "#3c3836", "#af3a03"] },
];
