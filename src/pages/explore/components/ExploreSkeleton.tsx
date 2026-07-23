import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { fadeUp } from "@/lib/motion";

type Props = {
  rows?: number;
};

const ROW_KEYS = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"] as const;

function Bone({ className }: { className: string }) {
  return <div className={cn("rounded-sm bg-surface-hover", className)} />;
}

export function ExploreSkeleton({ rows = 8 }: Props) {
  const keys = ROW_KEYS.slice(0, Math.min(rows, ROW_KEYS.length));

  return (
    <motion.div {...fadeUp(0.04)} className="flex flex-col" aria-hidden>
      <div className="grid grid-cols-[2.5rem_minmax(0,1.2fr)_minmax(0,1fr)_5.5rem_7rem] gap-4 border-b border-border pb-2">
        <Bone className="h-2.5 w-6 ml-auto" />
        <Bone className="h-2.5 w-14" />
        <Bone className="h-2.5 w-16" />
        <Bone className="h-2.5 w-12 ml-auto" />
        <Bone className="h-2.5 w-14 ml-auto" />
      </div>
      {keys.map((key, i) => (
        <div
          key={key}
          className="grid grid-cols-[2.5rem_minmax(0,1.2fr)_minmax(0,1fr)_5.5rem_7rem] items-start gap-4 border-b border-border py-4 first:border-t animate-pulse"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="flex justify-end">
            <Bone className="h-2.5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col gap-2">
            <Bone className="h-3 w-36 max-w-full" />
            <Bone className="h-2.5 w-48 max-w-full" />
          </div>
          <div className="min-w-0 flex flex-col gap-2">
            <Bone className="h-3 w-28 max-w-full" />
            <Bone className="h-2.5 w-16" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Bone className="h-2.5 w-8" />
            <Bone className="h-2.5 w-6" />
          </div>
          <div className="flex justify-end">
            <Bone className="h-7 w-16" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}
