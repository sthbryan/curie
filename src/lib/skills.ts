import type { Activity, AgentSummary, SkillInfo, SkillUpdateInfo } from "@/components/types";

export function summarizeAgents(skills: SkillInfo[]): AgentSummary[] {
  const counts = new Map<string, number>();

  for (const skill of skills) {
    for (const agent of skill.agents) {
      const key = agent.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const DAY = 86_400_000;

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * DAY],
  ["month", 30 * DAY],
  ["day", DAY],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>();

function relativeFormatter(locale: string): Intl.RelativeTimeFormat {
  const cached = relativeFormatters.get(locale);
  if (cached) return cached;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });
  relativeFormatters.set(locale, formatter);
  return formatter;
}

export function formatRelative(iso: string, now = Date.now(), locale = "en"): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;

  const delta = Math.max(0, now - ms);
  const format = relativeFormatter(locale);

  for (const [unit, size] of RELATIVE_UNITS) {
    const count = Math.floor(delta / size);
    if (count >= 1) return format.format(-count, unit);
  }

  return format.format(0, "second");
}

export function buildRecentActivity(skills: SkillInfo[]): Activity[] {
  const events: Activity[] = [];

  for (const skill of skills) {
    if (skill.installedAt) {
      events.push({
        kind: "install",
        skill: skill.name,
        source: skill.source,
        at: skill.installedAt,
      });
    }

    if (
      skill.updatedAt &&
      skill.installedAt &&
      skill.updatedAt !== skill.installedAt &&
      Date.parse(skill.updatedAt) > Date.parse(skill.installedAt)
    ) {
      events.push({
        kind: "update",
        skill: skill.name,
        source: skill.source,
        at: skill.updatedAt,
      });
    } else if (skill.updatedAt && !skill.installedAt) {
      events.push({
        kind: "update",
        skill: skill.name,
        source: skill.source,
        at: skill.updatedAt,
      });
    }
  }

  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function maxAgentCount(agents: AgentSummary[]): number {
  return Math.max(1, ...agents.map((a) => a.count), 1);
}

export function filterSkills(
  skills: SkillInfo[],
  query: string,
  agent: string | null,
  options?: {
    updatesOnly?: boolean;
    updateNames?: Set<string>;
  },
): SkillInfo[] {
  const q = query.trim().toLowerCase();
  const updatesOnly = options?.updatesOnly ?? false;
  const updateNames = options?.updateNames;

  return skills
    .filter((skill) => {
      if (updatesOnly && updateNames && !updateNames.has(skill.name)) return false;
      if (agent && !skill.agents.some((a) => a === agent)) return false;
      if (!q) return true;
      const hay = [skill.name, skill.source ?? "", skill.path, ...skill.agents]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      if (updateNames) {
        const aUp = updateNames.has(a.name) ? 0 : 1;
        const bUp = updateNames.has(b.name) ? 0 : 1;
        if (aUp !== bUp) return aUp - bUp;
      }
      return a.name.localeCompare(b.name);
    });
}

export function skillTimestamp(skill: SkillInfo): string | null {
  return skill.updatedAt ?? skill.installedAt;
}

export function updateNameSet(updates: SkillUpdateInfo[]): Set<string> {
  return new Set(updates.filter((u) => u.updateAvailable).map((u) => u.name));
}

export function availableUpdates(
  skills: SkillInfo[],
  updates: SkillUpdateInfo[],
): Array<{ skill: SkillInfo; source: string | null }> {
  const byName = new Map(skills.map((s) => [s.name, s]));
  return updates
    .filter((u) => u.updateAvailable)
    .map((u) => {
      const skill = byName.get(u.name);
      if (!skill) return null;
      return { skill, source: u.source ?? skill.source };
    })
    .filter((row): row is { skill: SkillInfo; source: string | null } => row !== null)
    .sort((a, b) => a.skill.name.localeCompare(b.skill.name));
}

export function formatInstalls(count: number): string {
  if (!count || count <= 0) return "";
  if (count >= 1_000_000) {
    const n = count / 1_000_000;
    const s = n >= 10 ? n.toFixed(0) : n.toFixed(1).replace(/\.0$/, "");
    return `${s}M`;
  }
  if (count >= 1_000) {
    const n = count / 1_000;
    const s = n >= 10 ? n.toFixed(0) : n.toFixed(1).replace(/\.0$/, "");
    return `${s}K`;
  }
  return String(count);
}

export function isSearchResultInstalled(
  hit: { name: string; source: string },
  skills: SkillInfo[],
): boolean {
  return skills.some((s) => {
    if (s.name !== hit.name) return false;
    if (!hit.source) return true;
    if (!s.source) return true;
    return (
      s.source === hit.source || s.source.includes(hit.source) || hit.source.includes(s.source)
    );
  });
}
