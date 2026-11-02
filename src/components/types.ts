import type { Lang } from "@/i18n";

// The palettes come from Sephiro; each id is one of its `data-sephiro-theme`
// values. `curie` is the one that mirrors Curie's own look. Every family ships
// a light and a dark palette, picked by the colour mode below.
export type ThemeFamily = "curie" | "asterism" | "fizza" | "pulso" | "dark";
// `auto` follows the OS; the other two pin the palette.
export type ColorMode = "auto" | "light" | "dark";
export type ColorScheme = "light" | "dark";
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
  theme: ThemeFamily;
  colorMode: ColorMode;
  sidebarOpen: boolean;
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
  failed?: string[];
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

export const COLOR_MODE_OPTIONS: ColorMode[] = ["auto", "light", "dark"];

// Swatches are copied from Sephiro's themes.css (bg / text / accent of each
// palette, per mode). They only drive the little preview cards and the status
// bar chip. `dark` is Sephiro's own rose family: its published `light` id is
// the light half of that same palette, so both come from one card.
export const THEME_OPTIONS: {
  id: ThemeFamily;
  label: string;
  swatches: Record<ColorScheme, [string, string, string]>;
}[] = [
  {
    id: "curie",
    label: "CURIE",
    swatches: {
      dark: ["#0a0a0a", "#f5f5f3", "#d71921"],
      light: ["#fafaf8", "#18181b", "#c2151c"],
    },
  },
  {
    id: "asterism",
    label: "ASTERISM",
    swatches: {
      dark: ["#111111", "#ececec", "#d71921"],
      light: ["#f7f7f7", "#171717", "#c4161d"],
    },
  },
  {
    id: "fizza",
    label: "FIZZA",
    swatches: {
      dark: ["#000000", "#e8e8e8", "#7c3aed"],
      light: ["#f7f7f7", "#171717", "#6d28d9"],
    },
  },
  {
    id: "pulso",
    label: "PULSO",
    swatches: {
      dark: ["#131713", "#f0f1ea", "#4e7657"],
      light: ["#f5f5f0", "#222720", "#3d7049"],
    },
  },
  {
    id: "dark",
    label: "SEPHIRO",
    swatches: {
      dark: ["#211719", "#f6edf0", "#b85c79"],
      light: ["#f8f1f2", "#2b2023", "#a84f6d"],
    },
  },
];
