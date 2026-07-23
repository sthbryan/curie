import { motion } from "motion/react";
import { useMemo } from "react";
import { Button } from "@/components/Button";
import { t } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { filterSkills, summarizeAgents, updateNameSet } from "@/lib/skills";
import { skills, skillUpdates } from "@/store/skills";
import { lang } from "@/store/system";
import { useInstalledFiltersStore } from "../store";

export function InstalledFilters() {
  const query = useInstalledFiltersStore((s) => s.query);
  const agentFilter = useInstalledFiltersStore((s) => s.agentFilter);
  const updatesOnly = useInstalledFiltersStore((s) => s.updatesOnly);
  const setQuery = useInstalledFiltersStore((s) => s.setQuery);
  const setAgentFilter = useInstalledFiltersStore((s) => s.setAgentFilter);
  const toggleUpdatesOnly = useInstalledFiltersStore((s) => s.toggleUpdatesOnly);
  const clearFilters = useInstalledFiltersStore((s) => s.clearFilters);

  const updateNames = useMemo(() => updateNameSet(skillUpdates.value), [skillUpdates.value]);
  const agents = useMemo(() => summarizeAgents(skills.value), [skills.value]);
  const filteredCount = useMemo(
    () =>
      filterSkills(skills.value, query, agentFilter, {
        updatesOnly,
        updateNames,
      }).length,
    [skills.value, query, agentFilter, updatesOnly, updateNames],
  );

  return (
    <motion.section {...fadeUp(0.05)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex min-w-0 flex-1 max-w-md">
          <span className="sr-only">{t(lang.value, "installed.search")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(lang.value, "installed.searchPlaceholder")}
            className="h-10 w-full border border-border-strong bg-bg px-3 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm"
          />
        </label>

        <span className="font-mono uppercase tracking-label text-micro text-fg-4">
          {t(lang.value, "installed.showing", { n: filteredCount, total: skills.value.length })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          selected={agentFilter === null && !updatesOnly}
          onClick={clearFilters}
        >
          {t(lang.value, "installed.filterAll")}
        </Button>
        <Button size="sm" variant="outline" selected={updatesOnly} onClick={toggleUpdatesOnly}>
          {t(lang.value, "installed.filterUpdates")}
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
