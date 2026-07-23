import { motion } from "motion/react";
import { useMemo } from "react";
import { Button } from "@/components/Button";
import { t } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { filterSkills, summarizeAgents, updateNameSet } from "@/lib/skills";
import { useSkillsStore } from "@/store/skills";
import { useUiStore } from "@/store/ui";
import { useInstalledFiltersStore } from "../store";

export function InstalledFilters() {
  const lang = useUiStore((s) => s.lang);
  const skills = useSkillsStore((s) => s.skills);
  const skillUpdates = useSkillsStore((s) => s.skillUpdates);

  const query = useInstalledFiltersStore((s) => s.query);
  const agentFilter = useInstalledFiltersStore((s) => s.agentFilter);
  const updatesOnly = useInstalledFiltersStore((s) => s.updatesOnly);
  const setQuery = useInstalledFiltersStore((s) => s.setQuery);
  const setAgentFilter = useInstalledFiltersStore((s) => s.setAgentFilter);
  const toggleUpdatesOnly = useInstalledFiltersStore((s) => s.toggleUpdatesOnly);
  const clearFilters = useInstalledFiltersStore((s) => s.clearFilters);

  const updateNames = useMemo(() => updateNameSet(skillUpdates), [skillUpdates]);
  const agents = useMemo(() => summarizeAgents(skills), [skills]);
  const filteredCount = useMemo(
    () =>
      filterSkills(skills, query, agentFilter, {
        updatesOnly,
        updateNames,
      }).length,
    [skills, query, agentFilter, updatesOnly, updateNames],
  );

  return (
    <motion.section {...fadeUp(0.05)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex min-w-0 flex-1 max-w-md">
          <span className="sr-only">{t(lang, "installed.search")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(lang, "installed.searchPlaceholder")}
            className="h-10 w-full border border-border-strong bg-bg px-3 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm"
          />
        </label>

        <span className="font-mono uppercase tracking-label text-micro text-fg-4">
          {t(lang, "installed.showing", { n: filteredCount, total: skills.length })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          selected={agentFilter === null && !updatesOnly}
          onClick={clearFilters}
        >
          {t(lang, "installed.filterAll")}
        </Button>
        <Button size="sm" variant="outline" selected={updatesOnly} onClick={toggleUpdatesOnly}>
          {t(lang, "installed.filterUpdates")}
          <span className="ml-2 opacity-60">{updateNames.size}</span>
        </Button>
        {agents.map((agent) => (
          <Button
            key={agent.id}
            size="sm"
            variant="outline"
            selected={agentFilter === agent.label}
            onClick={() => setAgentFilter(agentFilter === agent.label ? null : agent.label)}
          >
            {agent.label}
            <span className="ml-2 opacity-60">{agent.count}</span>
          </Button>
        ))}
      </div>
    </motion.section>
  );
}
