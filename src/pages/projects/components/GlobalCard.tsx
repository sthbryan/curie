import { Globe } from "lucide-react";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";

type Props = {
  active: boolean;
  count: number;
  onOpen: () => void;
};

export function GlobalCard({ active, count, onOpen }: Props) {
  const t = useT("projects");

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex flex-col gap-4 border border-dashed p-5 text-left transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-fg",
        active
          ? "border-fg-3 bg-surface-tint"
          : "border-border-strong bg-surface-tint/60 hover:border-fg-4",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 font-mono font-bold uppercase tracking-label text-mono text-fg">
          <Globe size={12} aria-hidden />
          {t("globalName")}
        </span>
        {active ? (
          <span className="shrink-0 font-mono uppercase tracking-label text-micro text-fg-3">
            {t("active")}
          </span>
        ) : null}
      </div>

      <p className="font-body text-sm text-fg-3">{t("globalHint")}</p>

      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-mono text-xl font-bold leading-none tabular-nums",
            count > 0 ? "text-fg" : "text-fg-4",
          )}
        >
          {count}
        </span>
        <span className="font-mono uppercase tracking-label text-micro text-fg-3">
          {t("skills")}
        </span>
      </div>
    </button>
  );
}
