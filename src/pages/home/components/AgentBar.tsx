import type { AgentSummary } from "@/components/types";
import { useT } from "@/i18n";

type Props = {
  agent: AgentSummary;
  capacity: number;
};

export function AgentBar({ agent, capacity }: Props) {
  const t = useT("home");
  const fill = Math.min(agent.count / capacity, 1);

  return (
    <div className="flex items-center gap-4 border-b border-border py-2 first:border-t">
      <span className="w-32 shrink-0 truncate font-mono text-mono text-fg-2">{agent.label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-border">
        <div
          className="h-full origin-left animate-bar-grow rounded-sm bg-fg-2"
          style={{ transform: `scaleX(${fill})` }}
        />
      </div>
      <span className="w-6 text-right font-mono text-mono font-bold leading-none tracking-tight text-fg tabular-nums">
        {agent.count}
      </span>
      <span className="w-12 text-right font-mono uppercase tracking-label text-micro text-fg-4">
        {agent.count === 1 ? t("skillWord") : t("skillsWord")}
      </span>
    </div>
  );
}
