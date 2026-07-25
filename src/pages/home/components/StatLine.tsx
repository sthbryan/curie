import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { agents, checkingUpdates, totalSkills, updates } from "../lib/derived";

type Entry = {
  value: number;
  label: string;
  pending?: boolean;
};

function Pair({ value, label, pending = false }: Entry) {
  return (
    <span className={cn("flex items-baseline gap-2", pending && "animate-pulse")}>
      <span className="font-mono text-xl font-bold leading-none tracking-tight text-fg tabular-nums">
        {value}
      </span>
      <span className="font-mono uppercase tracking-label text-micro text-fg-3">{label}</span>
    </span>
  );
}

export function StatLine() {
  const t = useT("home");
  const entries: Entry[] = [
    { value: totalSkills.value, label: t("statSkills") },
    { value: agents.value.length, label: t("statTools") },
    { value: updates.value.length, label: t("statUpdates"), pending: checkingUpdates.value },
  ];

  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
      {entries.map((entry, index) => (
        <span key={entry.label} className="flex items-baseline gap-5">
          {index > 0 ? <span className="text-fg-4">·</span> : null}
          <Pair {...entry} />
        </span>
      ))}
    </div>
  );
}
