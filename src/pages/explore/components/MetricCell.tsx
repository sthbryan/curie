import { CloudDownload, TrendingDown, TrendingUp } from "lucide-react";
import type { ExploreView, SkillExploreResult } from "@/components/types";
import { cn } from "@/lib/cn";
import { formatInstalls } from "@/lib/skills";

type Props = {
  view: ExploreView;
  result: SkillExploreResult;
};

const TOTAL = "flex items-center gap-1 font-mono tracking-label text-micro text-fg-4";
const PRIMARY = "font-mono text-mono tabular-nums";

function total(installs: number) {
  return formatInstalls(installs) || String(installs || 0);
}

export function MetricCell({ view, result }: Props) {
  if (view === "all-time") {
    return <span className={cn(PRIMARY, "text-fg-2")}>{total(result.installs)}</span>;
  }

  if (view === "trending") {
    const change = result.change;
    const up = (change ?? 0) > 0;
    const down = (change ?? 0) < 0;
    return (
      <>
        <span
          className={cn(
            PRIMARY,
            "flex items-center gap-1",
            up && "text-success",
            down && "text-error",
            !up && !down && "text-fg-3",
          )}
        >
          {up ? <TrendingUp size={11} strokeWidth={1.5} /> : null}
          {down ? <TrendingDown size={11} strokeWidth={1.5} /> : null}
          {change === null ? "—" : `${up ? "+" : ""}${change}`}
        </span>
        <span className={TOTAL}>
          <CloudDownload size={10} />
          {total(result.installs)}
        </span>
      </>
    );
  }

  const today = result.installsYesterday;
  return (
    <>
      <span className={cn(PRIMARY, today ? "text-fg-2" : "text-fg-4")}>
        {today === null ? "—" : `+${total(today)}`}
      </span>
      <span className={TOTAL}>
        <CloudDownload size={10} />
        {total(result.installs)}
      </span>
    </>
  );
}
