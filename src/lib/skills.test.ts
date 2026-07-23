import { describe, expect, it } from "vitest";
import type { SkillInfo } from "../components/types";
import { buildRecentActivity, filterSkills, maxAgentCount, summarizeAgents } from "./skills";

const sample: SkillInfo[] = [
  {
    name: "impeccable",
    path: "/a/impeccable",
    scope: "global",
    agents: ["Claude Code", "Codex"],
    source: "pbakaus/impeccable",
    sourceUrl: null,
    sourceType: "github",
    installedAt: "2026-07-10T10:00:00.000Z",
    updatedAt: "2026-07-12T10:00:00.000Z",
  },
  {
    name: "find-skills",
    path: "/a/find-skills",
    scope: "global",
    agents: ["Codex", "Zed"],
    source: "vercel-labs/skills",
    sourceUrl: null,
    sourceType: "github",
    installedAt: "2026-07-11T10:00:00.000Z",
    updatedAt: "2026-07-11T10:00:00.000Z",
  },
];

describe("summarizeAgents", () => {
  it("counts skills per agent and sorts by count", () => {
    const agents = summarizeAgents(sample);
    expect(agents[0]).toMatchObject({ label: "Codex", count: 2 });
    expect(agents.find((a) => a.label === "Claude Code")?.count).toBe(1);
    expect(agents.find((a) => a.label === "Zed")?.count).toBe(1);
  });
});

describe("buildRecentActivity", () => {
  it("builds install and update events sorted by date", () => {
    const events = buildRecentActivity(sample);
    expect(events[0]?.kind).toBe("update");
    expect(events[0]?.skill).toBe("impeccable");
    expect(events.some((e) => e.kind === "install" && e.skill === "find-skills")).toBe(true);
  });
});

describe("maxAgentCount", () => {
  it("returns at least 1", () => {
    expect(maxAgentCount([])).toBe(1);
    expect(maxAgentCount(summarizeAgents(sample))).toBe(2);
  });
});

describe("filterSkills", () => {
  it("filters by agent and query", () => {
    expect(filterSkills(sample, "", "Zed")).toHaveLength(1);
    expect(filterSkills(sample, "impec", null)[0]?.name).toBe("impeccable");
    expect(filterSkills(sample, "missing", null)).toHaveLength(0);
  });
});
