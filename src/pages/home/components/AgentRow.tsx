import { motion } from "motion/react";
import type { AgentSummary } from "@/components/types";
import { useT } from "@/i18n";
import { listItem } from "@/lib/motion";

type Props = {
  agent: AgentSummary;
  capacity: number;
};

function density(count: number, capacity: number): number {
  return Math.min(count / capacity, 1);
}

export function AgentRow({ agent, capacity }: Props) {
  const t = useT();
  return (
    <motion.div
      variants={listItem}
      className="flex items-center gap-4 border-b border-border py-3 first:border-t"
    >
      <span className="font-mono text-mono text-fg-2 w-32 truncate">{agent.label}</span>
      <div className="flex flex-1 items-center gap-2">
        <div className="relative h-1.5 flex-1 bg-border overflow-hidden rounded-sm">
          <motion.div
            className="absolute inset-y-0 left-0 bg-fg-2"
            initial={{ width: 0 }}
            animate={{ width: `${density(agent.count, capacity) * 100}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          />
        </div>
      </div>
      <span className="font-mono text-mono font-bold leading-none tracking-tight w-5 text-right text-fg tabular-nums">
        {agent.count}
      </span>
      <span className="font-mono uppercase tracking-label text-micro w-14 text-right text-fg-4">
        {agent.count === 1 ? t("home.skillWord") : t("home.skillsWord")}
      </span>
    </motion.div>
  );
}
