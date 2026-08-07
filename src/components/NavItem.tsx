import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/motion";

type Props = {
  number: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
};

export function NavItem({ number, label, icon: Icon, active, expanded, onClick }: Props) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={cn(
        "group relative flex h-11 w-full items-center overflow-hidden rounded-sm text-left transition-colors duration-150",
        active ? "bg-surface-tint text-fg" : "text-fg-3 hover:bg-surface-hover hover:text-fg",
      )}
    >
      {active ? (
        <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 bg-fg" aria-hidden />
      ) : null}

      <span className="flex w-10 shrink-0 items-center justify-center">
        <Icon
          size={16}
          strokeWidth={1.5}
          className={cn("transition-colors group-hover:text-fg", active ? "text-fg" : "text-fg-3")}
        />
      </span>

      <span
        aria-hidden={!expanded}
        className={cn(
          "absolute top-1/2 left-9.5 flex -translate-y-1/2 items-baseline gap-2 whitespace-nowrap",
          !shouldReduceMotion &&
            "transition-[opacity,translate] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          expanded ? "opacity-100 translate-x-0 delay-[60ms]" : "opacity-0 -translate-x-1",
        )}
      >
        <span
          className={cn(
            "font-mono leading-none tabular-nums text-micro",
            active ? "text-fg-3" : "text-fg-4",
          )}
        >
          {number}
        </span>
        <span
          className={cn(
            "font-mono uppercase leading-none tracking-label text-micro transition-colors group-hover:text-fg",
            active ? "font-bold text-fg" : "text-fg-2",
          )}
        >
          {label}
        </span>
      </span>
    </button>
  );
}
