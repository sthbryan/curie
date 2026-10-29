import { Check } from "lucide-react";

import "@zovaris/sephiro/css/card.css";

import type { ThemeFamily } from "@/components/types";
import { cn } from "@/lib/cn";

type Props = {
  id: ThemeFamily;
  active: boolean;
  label: string;
  swatches: [string, string, string];
  onClick: () => void;
};

export function ThemeCard({ id, active, label, swatches, onClick }: Props) {
  const [bg, fg, accent] = swatches;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-theme-option={id}
      data-interactive
      data-selected={active || undefined}
      className="sph-card flex flex-col gap-2.5 p-2.5 text-left"
    >
      <span
        className="flex h-13 w-full overflow-hidden rounded-sm border border-border-strong"
        style={{ backgroundColor: bg }}
        aria-hidden
      >
        <span className="w-2.5 shrink-0" style={{ backgroundColor: fg, opacity: 0.1 }} />
        <span className="flex flex-1 flex-col justify-center gap-1.5 px-2">
          <span className="h-0.5 w-3/5" style={{ backgroundColor: fg, opacity: 0.7 }} />
          <span className="h-0.5 w-2/5" style={{ backgroundColor: fg, opacity: 0.3 }} />
        </span>
        <span className="m-2 h-2.5 w-2.5 shrink-0 self-start" style={{ backgroundColor: accent }} />
      </span>

      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "font-mono uppercase tracking-label text-mono",
            active ? "font-bold text-fg" : "text-fg-2",
          )}
        >
          {label}
        </span>
        {active ? <Check size={11} className="text-fg" aria-hidden /> : null}
      </span>
    </button>
  );
}
