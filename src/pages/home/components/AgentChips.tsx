import type { AgentSummary } from "@/components/types";

type Props = {
  agents: AgentSummary[];
};

export function AgentChips({ agents }: Props) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border pt-4">
      {agents.map((agent) => (
        <span
          key={agent.id}
          className="flex items-baseline gap-2 border border-border px-2.5 py-1.5 font-mono text-mono text-fg-2"
        >
          <span className="truncate">{agent.label}</span>
          <span className="font-bold text-fg tabular-nums">{agent.count}</span>
        </span>
      ))}
    </div>
  );
}
