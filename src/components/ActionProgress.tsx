import { LoaderCircle } from "lucide-react";
import { useReducedMotionConfig } from "motion/react";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";

type Props = {
  active: boolean;
  labelKey: string;
  className?: string;
};

export function ActionProgress({ active, labelKey, className = "" }: Props) {
  const t = useT();
  const shouldReduceMotion = useReducedMotionConfig();

  if (!active) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex h-7 items-center justify-center gap-1.5 px-2.5 font-mono uppercase tracking-label text-micro text-fg-3",
        className,
      )}
    >
      <LoaderCircle
        size={11}
        strokeWidth={1.5}
        aria-hidden
        className={cn(shouldReduceMotion !== true && "animate-spin")}
      />
      {t(labelKey)}
    </span>
  );
}
