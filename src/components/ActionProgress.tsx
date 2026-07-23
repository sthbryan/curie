import type { Lang } from "@/i18n";
import { t } from "@/i18n";
import { cn } from "@/lib/cn";
import { useAsymptoticProgress } from "@/lib/useAsymptoticProgress";
import { useSystemStore } from "@/store/system";

type Props = {
  active: boolean;
  labelKey: string;
  lang: Lang;
  className?: string;
};

/**
 * Compact busy control for row actions. Shows a filled bar + percent
 * (asymptotic — no real CLI progress stream). Falls back to a static
 * label when reduced motion is on.
 */
export function ActionProgress({ active, labelKey, lang, className = "" }: Props) {
  const reducedMotion = useSystemStore((s) => s.reducedMotion);
  const prefersReduced =
    reducedMotion === "true" ||
    (reducedMotion === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const pct = useAsymptoticProgress(active && !prefersReduced);

  if (!active) return null;

  if (prefersReduced) {
    return (
      <span
        className={cn(
          "inline-flex h-7 min-w-16 items-center justify-center px-2.5 font-mono uppercase tracking-label text-micro text-fg-3",
          className,
        )}
        aria-live="polite"
      >
        {t(lang, labelKey)}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "relative h-7 w-19 overflow-hidden rounded-sm border border-fg bg-surface-tint",
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={t(lang, labelKey)}
    >
      <div
        className="absolute inset-y-0 left-0 bg-fg/20 transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
      <span className="relative z-10 flex h-full items-center justify-center font-mono text-micro font-bold tracking-label text-fg tabular-nums">
        {pct}%
      </span>
    </div>
  );
}
