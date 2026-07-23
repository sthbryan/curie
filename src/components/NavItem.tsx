import cn from "cnfast";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { duration, easeOut } from "@/lib/motion";

type Props = {
  number: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
};

export function NavItem({ number, label, icon: Icon, active, expanded, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={label}
      className={cn(
        "relative flex h-11 w-full items-center overflow-hidden rounded-sm px-2.5 text-left transition-colors duration-150",
        active ? "bg-surface-tint text-fg" : "text-fg-3 hover:bg-surface-hover hover:text-fg",
      )}
    >
      <Icon
        size={16}
        strokeWidth={1.5}
        className={cn("shrink-0 transition-colors duration-150", active ? "text-fg" : "text-fg-3")}
      />

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.span
            key="label"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: duration.base, ease: easeOut, delay: 0.06 }}
            className="absolute left-9 top-1/2 flex -translate-y-1/2 flex-col items-start gap-0.5 whitespace-nowrap"
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
                "font-mono uppercase leading-none tracking-label text-mono",
                active ? "font-bold text-fg" : "text-fg-2",
              )}
            >
              {label}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
