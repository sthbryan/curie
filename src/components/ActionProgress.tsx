import { Spinner } from "@zovaris/sephiro/spinner";

import { useT } from "@/i18n";
import { cn } from "@/lib/cn";

type Props = {
  active: boolean;
  labelKey: string;
  className?: string;
};

export function ActionProgress({ active, labelKey, className = "" }: Props) {
  const t = useT();

  if (!active) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 px-2.5 font-mono uppercase tracking-label text-micro text-fg-3",
        className,
      )}
    >
      <Spinner size="sm" />
      {t(labelKey)}
    </span>
  );
}
