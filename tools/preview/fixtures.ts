import type {
  AppUpdateInfo,
  NodeInfo,
  Project,
  SetupPlan,
  SkillExploreResult,
  SkillInfo,
  SkillSearchResult,
  SkillUpdateInfo,
} from "@/components/types";

export const NODE: NodeInfo = {
  installed: true,
  version: "v22.11.0",
  path: "/Users/you/.volta/bin/node",
  manager: "volta",
};

export const NOT_INSTALLED: NodeInfo = {
  installed: false,
  version: null,
  path: null,
  manager: null,
};

export const SKILLS: SkillInfo[] = [
  {
    name: "commit",
    path: "/Users/you/.claude/skills/commit",
    scope: "global",
    agents: ["claude-code"],
    source: "sthbryan/skills",
    sourceUrl: "https://github.com/sthbryan/skills",
    sourceType: "github",
    installedAt: "2026-08-02T10:12:00Z",
    updatedAt: "2026-09-14T08:30:00Z",
  },
  {
    name: "ponytail",
    path: "/Users/you/.claude/skills/ponytail",
    scope: "global",
    agents: ["claude-code", "codex"],
    source: "obra/ponytail",
    sourceUrl: "https://github.com/obra/ponytail",
    sourceType: "github",
    installedAt: "2026-08-02T10:12:00Z",
    updatedAt: "2026-09-30T19:04:00Z",
  },
  {
    name: "changelog-generator",
    path: "/Users/you/.codex/skills/changelog-generator",
    scope: "global",
    agents: ["codex", "cursor", "windsurf"],
    source: "composio/changelog-generator",
    sourceUrl: "https://github.com/composio/changelog-generator",
    sourceType: "github",
    installedAt: "2026-08-11T12:00:00Z",
    updatedAt: null,
  },
  {
    name: "bulk-classify",
    path: "/Users/you/.cursor/skills/bulk-classify",
    scope: "global",
    agents: ["cursor"],
    source: null,
    sourceUrl: null,
    sourceType: null,
    installedAt: "2026-08-20T09:41:00Z",
    updatedAt: null,
  },
  {
    name: "design-review",
    path: "/Users/you/.claude/skills/design-review",
    scope: "global",
    agents: ["claude-code", "amp"],
    source: "sthbryan/design-review",
    sourceUrl: "https://github.com/sthbryan/design-review",
    sourceType: "github",
    installedAt: "2026-09-01T16:22:00Z",
    updatedAt: "2026-10-02T11:15:00Z",
  },
  {
    name: "rust-perf-audit",
    path: "/Users/you/.codex/skills/rust-perf-audit",
    scope: "global",
    agents: ["codex"],
    source: "anthropics/skills",
    sourceUrl: "https://github.com/anthropics/skills",
    sourceType: "github",
    installedAt: "2026-09-18T07:05:00Z",
    updatedAt: null,
  },
];

export const UPDATES: SkillUpdateInfo[] = [
  {
    name: "ponytail",
    source: "obra/ponytail",
    updateAvailable: true,
    checkable: true,
    checked: true,
  },
  {
    name: "commit",
    source: "sthbryan/skills",
    updateAvailable: false,
    checkable: true,
    checked: true,
  },
  {
    name: "changelog-generator",
    source: "composio/changelog-generator",
    updateAvailable: true,
    checkable: true,
    checked: true,
  },
];

export const PROJECTS: Project[] = [
  {
    id: "curie",
    name: "curie",
    path: "/Users/you/Documents/Codes/curie",
    addedAt: "2026-07-30T10:00:00Z",
  },
  {
    id: "sephiro",
    name: "Sephiro-Toolkit",
    path: "/Users/you/Documents/Codes/Sephiro-Toolkit",
    addedAt: "2026-08-14T10:00:00Z",
  },
];

function explore(name: string, source: string, installs: number): SkillExploreResult {
  return {
    id: `${source}/${name}`,
    name,
    source,
    installs,
    package: `@skills/${name}`,
    url: `https://github.com/${source}/tree/main/${name}`,
    installsYesterday: Math.round(installs * 0.02),
    change: installs % 7,
    isOfficial: source.startsWith("anthropics"),
  };
}

export const EXPLORE: SkillExploreResult[] = [
  explore("pdf", "anthropics/skills", 48211),
  explore("slides", "anthropics/skills", 31904),
  explore("frontend-design", "anthropics/skills", 27813),
  explore("commit", "sthbryan/skills", 19322),
  explore("ponytail", "obra/ponytail", 15118),
  explore("changelog-generator", "composio/changelog-generator", 12470),
  explore("bulk-classify", "obra/skills", 8211),
  explore("rust-perf-audit", "anthropics/skills", 6094),
];

export const FIND: SkillSearchResult[] = [
  {
    id: "anthropics/skills/pdf",
    name: "pdf",
    source: "anthropics/skills",
    installs: 48211,
    package: "@skills/pdf",
    url: "https://github.com/anthropics/skills/tree/main/pdf",
  },
  {
    id: "anthropics/skills/frontend-design",
    name: "frontend-design",
    source: "anthropics/skills",
    installs: 27813,
    package: "@skills/frontend-design",
    url: "https://github.com/anthropics/skills/tree/main/frontend-design",
  },
];

export const APP_UPDATE: AppUpdateInfo = {
  currentVersion: "0.8.0",
  latestVersion: "0.9.0",
  updateAvailable: true,
  releaseUrl: "https://github.com/sthbryan/curie/releases/tag/v0.9.0",
  releaseNotes: null,
};

export const PLAN: SetupPlan = {
  node: NOT_INSTALLED,
  manager: { id: "volta", path: "/Users/you/.volta/bin/volta" },
  steps: ["check", "volta", "node", "verify", "done"],
  command: "curl https://get.volta.sh | bash",
};
