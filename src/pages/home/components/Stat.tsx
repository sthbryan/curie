import cn from "cnfast";
import { motion } from "motion/react";
import { staggerItem } from "@/lib/motion";

type Props = {
  label: string;
  value: number | string;
  isLast?: boolean;
};

export function Stat({ label, value, isLast = false }: Props) {
  return (
    <motion.div
      variants={staggerItem}
      className={cn("flex min-w-0 flex-1 flex-col gap-2 py-5", {
        "border-r border-border pr-6 mr-6": !isLast,
      })}
    >
      <span className="font-mono uppercase tracking-label text-micro text-fg-4">{label}</span>
      <span className="font-display text-heading font-bold leading-none tracking-tight text-fg tabular-nums">
        {value}
      </span>
    </motion.div>
  );
}
