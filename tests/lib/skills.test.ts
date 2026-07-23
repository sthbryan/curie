import { describe, expect, it } from "vitest";
import type { SkillInfo, SkillUpdateInfo } from "@/components/types";
import {
  availableUpdates,
  buildRecentActivity,
  filterSkills,
  formatInstalls,
  formatRelative,
  isSearchResultInstalled,
  maxAgentCount,
  skillTimestamp,
  summarizeAgents,
  updateNameSet,
} from "./skills";

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

const sampleUpdates: SkillUpdateInfo[] = [
  {
    name: "impeccable",
    source: "pbakaus/impeccable",
    updateAvailable: true,
    checkable: true,
  },
  {
    name: "find-skills",
    source: "vercel-labs/skills",
    updateAvailable: false,
    checkable: true,
  },
  {
    name: "local-only",
    source: null,
    updateAvailable: false,
    checkable: false,
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

  it("filters updates-only and sorts update-available first", () => {
    const names = updateNameSet(sampleUpdates);
    const only = filterSkills(sample, "", null, { updatesOnly: true, updateNames: names });
    expect(only.map((s) => s.name)).toEqual(["impeccable"]);

    const all = filterSkills(sample, "", null, { updateNames: names });
    expect(all[0]?.name).toBe("impeccable");
  });

  it("falls back to name sort when updateNames is empty or all skills share status", () => {
    const allNoUpdates = filterSkills(sample, "", null, { updateNames: new Set() });
    expect(allNoUpdates.map((s) => s.name)).toEqual(["find-skills", "impeccable"]);
  });
});

describe("availableUpdates", () => {
  it("intersects update flags with installed skills", () => {
    const rows = availableUpdates(sample, sampleUpdates);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.skill.name).toBe("impeccable");
  });

  it("drops updates whose skill is not installed", () => {
    const rows = availableUpdates(sample, [
      ...sampleUpdates,
      {
        name: "ghost",
        source: "x/y",
        updateAvailable: true,
        checkable: true,
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.skill.name).toBe("impeccable");
  });

  it("sorts available updates alphabetically by skill name", () => {
    const rows = availableUpdates(sample, [
      {
        name: "find-skills",
        source: "vercel-labs/skills",
        updateAvailable: true,
        checkable: true,
      },
      {
        name: "impeccable",
        source: "pbakaus/impeccable",
        updateAvailable: true,
        checkable: true,
      },
    ]);
    expect(rows.map((r) => r.skill.name)).toEqual(["find-skills", "impeccable"]);
  });
});

describe("formatInstalls", () => {
  it("formats compact counts", () => {
    expect(formatInstalls(0)).toBe("");
    expect(formatInstalls(42)).toBe("42");
    expect(formatInstalls(5500)).toBe("5.5K");
    expect(formatInstalls(11865)).toBe("12K");
    expect(formatInstalls(1_200_000)).toBe("1.2M");
  });
});

describe("isSearchResultInstalled", () => {
  it("matches by name and source", () => {
    expect(
      isSearchResultInstalled({ name: "impeccable", source: "pbakaus/impeccable" }, sample),
    ).toBe(true);
    expect(isSearchResultInstalled({ name: "impeccable", source: "other/repo" }, sample)).toBe(
      false,
    );
    expect(isSearchResultInstalled({ name: "missing", source: "x/y" }, sample)).toBe(false);
  });
});

describe("formatRelative", () => {
  const now = Date.parse("2026-07-22T12:00:00.000Z");

  it("returns the raw iso string when the date cannot be parsed", () => {
    expect(formatRelative("not-a-date", now)).toBe("not-a-date");
  });

  it("formats sub-minute, sub-hour, sub-day, and sub-month deltas", () => {
    expect(formatRelative("2026-07-22T11:59:30.000Z", now)).toBe("just now");
    expect(formatRelative("2026-07-22T11:55:00.000Z", now)).toBe("5m ago");
    expect(formatRelative("2026-07-22T10:00:00.000Z", now)).toBe("2h ago");
    expect(formatRelative("2026-07-21T12:00:00.000Z", now)).toBe("yesterday");
    expect(formatRelative("2026-07-08T12:00:00.000Z", now)).toBe("14d ago");
  });

  it("clamps future deltas to 0", () => {
    expect(formatRelative("2026-07-22T12:00:00.000Z", now)).toBe("just now");
  });

  it("formats months and years for long deltas", () => {
    expect(formatRelative("2026-01-22T12:00:00.000Z", now)).toBe("6mo ago");
    expect(formatRelative("2024-07-22T12:00:00.000Z", now)).toBe("2y ago");
  });
});

describe("buildRecentActivity", () => {
  it("emits an update event when updatedAt exists without installedAt", () => {
    const orphan: SkillInfo = {
      ...sample[0],
      installedAt: null,
      updatedAt: "2026-07-15T12:00:00.000Z",
    };
    const events = buildRecentActivity([orphan]);
    expect(events.some((e) => e.kind === "update" && e.skill === "impeccable")).toBe(true);
    expect(events.some((e) => e.kind === "install")).toBe(false);
  });

  it("skips the update event when updatedAt equals installedAt", () => {
    const events = buildRecentActivity([
      {
        ...sample[0],
        installedAt: "2026-07-12T10:00:00.000Z",
        updatedAt: "2026-07-12T10:00:00.000Z",
      },
    ]);
    expect(events.some((e) => e.kind === "update")).toBe(false);
  });
});

describe("skillTimestamp", () => {
  it("prefers updatedAt and falls back to installedAt", () => {
    expect(skillTimestamp(sample[0])).toBe("2026-07-12T10:00:00.000Z");
    expect(skillTimestamp({ ...sample[0], updatedAt: null })).toBe("2026-07-10T10:00:00.000Z");
    expect(skillTimestamp({ ...sample[0], updatedAt: null, installedAt: null })).toBeNull();
  });
});
