import { describe, expect, it } from "vitest";
import type { SkillInfo } from "@/components/types";
import { buildSearchIndex, searchKey, selectSkills } from "@/pages/installed/lib/query";

function skill(name: string, over: Partial<SkillInfo> = {}): SkillInfo {
  return {
    name,
    path: `/skills/${name}`,
    scope: "global",
    agents: ["Codex"],
    source: `me/${name}`,
    sourceUrl: null,
    sourceType: "github",
    installedAt: "2026-07-10T10:00:00.000Z",
    updatedAt: null,
    ...over,
  };
}

const rows = [
  skill("beta", { agents: ["Codex", "Zed"], updatedAt: "2026-07-20T10:00:00.000Z" }),
  skill("alpha", { agents: ["Codex"], source: "other/alpha" }),
  skill("gamma", { agents: [], source: null, installedAt: null }),
];

const index = buildSearchIndex(rows);
const noFilters = { query: "", agent: null, updatesOnly: false };
const byName = { key: "name", dir: "asc" } as const;

describe("searchKey", () => {
  it("folds name, source, path and agents into one lowercase haystack", () => {
    const key = searchKey(rows[0]);
    expect(key).toContain("beta");
    expect(key).toContain("me/beta");
    expect(key).toContain("/skills/beta");
    expect(key).toContain("zed");
    expect(key).toBe(key.toLowerCase());
  });

  it("survives a missing source", () => {
    expect(searchKey(rows[2])).toContain("gamma");
  });
});

describe("buildSearchIndex", () => {
  it("keys every skill by its path", () => {
    expect(index.size).toBe(3);
    expect(index.get("/skills/alpha")).toContain("other/alpha");
  });
});

describe("selectSkills", () => {
  it("matches the query against any indexed field", () => {
    const hit = (q: string) =>
      selectSkills(rows, index, { ...noFilters, query: q }, new Set(), byName).map((s) => s.name);

    expect(hit("alph")).toEqual(["alpha"]);
    expect(hit("other/")).toEqual(["alpha"]);
    expect(hit("zed")).toEqual(["beta"]);
    expect(hit("  ZED  ")).toEqual(["beta"]);
    expect(hit("nope")).toEqual([]);
  });

  it("falls back to hashing on the fly when the index misses a row", () => {
    const stale = new Map<string, string>();
    const found = selectSkills(rows, stale, { ...noFilters, query: "alpha" }, new Set(), byName);
    expect(found.map((s) => s.name)).toEqual(["alpha"]);
  });

  it("filters by tool", () => {
    const only = selectSkills(rows, index, { ...noFilters, agent: "Zed" }, new Set(), byName);
    expect(only.map((s) => s.name)).toEqual(["beta"]);
  });

  it("combines the tool filter with the updates filter", () => {
    const outdated = new Set(["beta", "alpha"]);
    const both = selectSkills(
      rows,
      index,
      { query: "", agent: "Zed", updatesOnly: true },
      outdated,
      byName,
    );
    expect(both.map((s) => s.name)).toEqual(["beta"]);

    const updatesOnly = selectSkills(
      rows,
      index,
      { ...noFilters, updatesOnly: true },
      outdated,
      byName,
    );
    expect(updatesOnly.map((s) => s.name)).toEqual(["alpha", "beta"]);
  });

  it("sorts by name in both directions without pinning updates", () => {
    const outdated = new Set(["gamma"]);
    expect(selectSkills(rows, index, noFilters, outdated, byName).map((s) => s.name)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
    expect(
      selectSkills(rows, index, noFilters, outdated, { key: "name", dir: "desc" }).map(
        (s) => s.name,
      ),
    ).toEqual(["gamma", "beta", "alpha"]);
  });

  it("sorts by source, tool count and timestamp", () => {
    const bySource = selectSkills(rows, index, noFilters, new Set(), {
      key: "source",
      dir: "asc",
    });
    expect(bySource.map((s) => s.source)).toEqual([null, "me/beta", "other/alpha"]);

    const byAgents = selectSkills(rows, index, noFilters, new Set(), {
      key: "agents",
      dir: "desc",
    });
    expect(byAgents[0]?.name).toBe("beta");

    const byUpdated = selectSkills(rows, index, noFilters, new Set(), {
      key: "updated",
      dir: "desc",
    });
    expect(byUpdated.map((s) => s.name)).toEqual(["beta", "alpha", "gamma"]);
  });

  it("leaves the input array untouched", () => {
    const before = rows.map((s) => s.name);
    selectSkills(rows, index, noFilters, new Set(), { key: "name", dir: "desc" });
    expect(rows.map((s) => s.name)).toEqual(before);
  });
});
