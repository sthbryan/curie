import { motion } from "motion/react";
import { useMemo } from "react";
import { Button } from "@/components/Button";
import { useT } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { filterSkills, summarizeAgents, updateNameSet } from "@/lib/skills";
import { skills, skillUpdates } from "@/store/skills";
import {
  agentFilter,
  clearFilters,
  query,
  setAgentFilter,
  setQuery,
  toggleUpdatesOnly,
  updatesOnly,
} from "../store/store";

export function InstalledFilters() {
  const t = useT("installed");
  const updateNames = useMemo(() => updateNameSet(skillUpdates.value), [skillUpdates.value]);
  const agents = useMemo(() => summarizeAgents(skills.value), [skills.value]);
  const filteredCount = useMemo(
    () =>
      filterSkills(skills.value, query.value, agentFilter.value, {
        updatesOnly: updatesOnly.value,
        updateNames,
      }).length,
    [skills.value, query.value, agentFilter.value, updatesOnly.value, updateNames],
  );

  return (
    <motion.section {...fadeUp(0.05)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex min-w-0 flex-1 max-w-md">
          <span className="sr-only">{t("search")}</span>
          <input
            type="search"
            value={query.value}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10 w-full border border-border-strong bg-bg px-3 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm"
          />
        </label>

        <span className="font-mono uppercase tracking-label text-micro text-fg-4">
          {t("showing", { n: filteredCount, total: skills.value.length })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="xs"
          variant="outline"
          selected={updatesOnly.value}
          onClick={toggleUpdatesOnly}
        >
          {t("filterUpdates")}
          <span className="ml-2 opacity-60">{updateNames.size}</span>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="xs"
          variant="outline"
          selected={agentFilter.value === null && !updatesOnly.value}
          onClick={clearFilters}
        >
          {t("filterAll")}
        </Button>
        {agents.map((agent) => (
          <Button
            key={agent.id}
            size="xs"
            variant="outline"
            selected={agentFilter.value === agent.label}
            onClick={() => setAgentFilter(agentFilter.value === agent.label ? null : agent.label)}
          >
            {agent.label}
            <span className="ml-2 opacity-60">{agent.count}</span>
          </Button>
        ))}
      </div>
    </motion.section>
  );
}
