import type { Activity, AgentSummary, SkillInfo, SkillUpdateInfo } from "../components/types";

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

export function formatRelative(iso: string, now = Date.now()): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;

  const delta = Math.max(0, now - ms);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function buildRecentActivity(skills: SkillInfo[], limit = 8): Activity[] {
  const events: Activity[] = [];

  for (const skill of skills) {
    if (skill.installedAt) {
      events.push({
        kind: "install",
        skill: skill.name,
        source: skill.source,
        when: formatRelative(skill.installedAt),
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
        when: formatRelative(skill.updatedAt),
        at: skill.updatedAt,
      });
    } else if (skill.updatedAt && !skill.installedAt) {
      events.push({
        kind: "update",
        skill: skill.name,
        source: skill.source,
        when: formatRelative(skill.updatedAt),
        at: skill.updatedAt,
      });
    }
  }

  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);
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
