import { motion } from "motion/react";
import { Button } from "@/components/Button";
import type { AgentSummary } from "@/components/types";
import type { Lang } from "@/i18n";
import { t } from "@/i18n";
import { fadeUp } from "@/lib/motion";

type Props = {
  lang: Lang;
  query: string;
  onQueryChange: (q: string) => void;
  filteredCount: number;
  totalCount: number;
  agents: AgentSummary[];
  agentFilter: string | null;
  updatesOnly: boolean;
  updateCount: number;
  onClearFilters: () => void;
  onToggleUpdatesOnly: () => void;
  onSelectAgent: (label: string) => void;
};

export function InstalledFilters({
  lang,
  query,
  onQueryChange,
  filteredCount,
  totalCount,
  agents,
  agentFilter,
  updatesOnly,
  updateCount,
  onClearFilters,
  onToggleUpdatesOnly,
  onSelectAgent,
}: Props) {
  return (
    <motion.section {...fadeUp(0.05)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex min-w-0 flex-1 max-w-md">
          <span className="sr-only">{t(lang, "installed.search")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t(lang, "installed.searchPlaceholder")}
            className="h-10 w-full border border-border-strong bg-bg px-3 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm"
          />
        </label>

        <span className="font-mono uppercase tracking-label text-micro text-fg-4">
          {t(lang, "installed.showing", { n: filteredCount, total: totalCount })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          selected={agentFilter === null && !updatesOnly}
          onClick={onClearFilters}
        >
          {t(lang, "installed.filterAll")}
        </Button>
        <Button size="sm" variant="outline" selected={updatesOnly} onClick={onToggleUpdatesOnly}>
          {t(lang, "installed.filterUpdates")}
          <span className="ml-2 opacity-60">{updateCount}</span>
        </Button>
        {agents.map((agent) => (
          <Button
            key={agent.id}
            size="sm"
            variant="outline"
            selected={agentFilter === agent.label}
            onClick={() => onSelectAgent(agent.label)}
          >
            {agent.label}
            <span className="ml-2 opacity-60">{agent.count}</span>
          </Button>
        ))}
      </div>
    </motion.section>
  );
}
