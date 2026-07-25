import type { SortDir } from "@/components/Table";
import type { SkillInfo } from "@/components/types";
import { skillTimestamp } from "@/lib/skills";

export type SortField = "name" | "source" | "agents" | "updated";

export type Filters = {
  query: string;
  agent: string | null;
  updatesOnly: boolean;
};

export function searchKey(skill: SkillInfo): string {
  return [skill.name, skill.source ?? "", skill.path, ...skill.agents].join(" ").toLowerCase();
}

export function buildSearchIndex(skills: SkillInfo[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const skill of skills) index.set(skill.path, searchKey(skill));
  return index;
}

function timestampOf(skill: SkillInfo): number {
  const iso = skillTimestamp(skill);
  if (!iso) return Number.NEGATIVE_INFINITY;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms;
}

function compare(a: SkillInfo, b: SkillInfo, key: SortField): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "source":
      return (a.source ?? "").localeCompare(b.source ?? "");
    case "agents":
      return a.agents.length - b.agents.length || a.name.localeCompare(b.name);
    case "updated":
      return timestampOf(a) - timestampOf(b) || a.name.localeCompare(b.name);
  }
}

export function selectSkills(
  skills: SkillInfo[],
  index: Map<string, string>,
  filters: Filters,
  updateNames: Set<string>,
  sort: { key: SortField; dir: SortDir },
): SkillInfo[] {
  const needle = filters.query.trim().toLowerCase();

  const rows = skills.filter((skill) => {
    if (filters.updatesOnly && !updateNames.has(skill.name)) return false;
    if (filters.agent && !skill.agents.includes(filters.agent)) return false;
    if (!needle) return true;
    return (index.get(skill.path) ?? searchKey(skill)).includes(needle);
  });

  const direction = sort.dir === "asc" ? 1 : -1;
  return rows.sort((a, b) => compare(a, b, sort.key) * direction);
}
