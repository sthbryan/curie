import type { Lang } from "@/i18n";

// The palettes come from Sephiro; each id is one of its `data-sephiro-theme`
// values. `curie` is the one that mirrors Curie's own look.
export type ThemeMode = "curie" | "light" | "asterism" | "fizza" | "pulso" | "dark" | "default";
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
  checked: boolean;
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

// Swatches are copied from Sephiro's themes.css (bg / text / accent of each
// palette). They only drive the little preview card in Settings.
export const THEME_OPTIONS: {
  id: ThemeMode;
  label: string;
  mode: "light" | "dark";
  swatches: [string, string, string];
}[] = [
  { id: "curie", label: "CURIE", mode: "dark", swatches: ["#0a0a0a", "#f5f5f3", "#d71921"] },
  {
    id: "light",
    label: "LIGHT",
    mode: "light",
    swatches: ["#f8f1f2", "#2b2023", "#a84f6d"],
  },
  {
    id: "asterism",
    label: "ASTERISM",
    mode: "dark",
    swatches: ["#111111", "#ececec", "#d71921"],
  },
  { id: "fizza", label: "FIZZA", mode: "dark", swatches: ["#000000", "#e8e8e8", "#7c3aed"] },
  { id: "pulso", label: "PULSO", mode: "light", swatches: ["#f5f5f0", "#222720", "#3d7049"] },
  { id: "dark", label: "DARK", mode: "dark", swatches: ["#211719", "#f6edf0", "#b85c79"] },
  // In the published 0.14.1 the default and dark ids resolve to the same
  // rose palette: the `:where(...)` base block is overridden by the pair
  // selector below it. The card mirrors that so the preview tells the truth.
  {
    id: "default",
    label: "SEPHIRO",
    mode: "dark",
    swatches: ["#211719", "#f6edf0", "#b85c79"],
  },
];
