import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { fadeUp } from "@/lib/motion";
import { Bone } from "./Bone";
import type { ColumnDef } from "./types";

const SKELETON_KEYS = Array.from({ length: 20 }, (_, i) => `skel-${i}`);

type Props<T> = {
  columns: ColumnDef<T>[];
  gridTemplate: string;
  skeletonRows: number;
};

export function TableSkeleton<T>({ columns, gridTemplate, skeletonRows }: Props<T>) {
  const keys = SKELETON_KEYS.slice(0, Math.min(skeletonRows, SKELETON_KEYS.length));

  return (
    <motion.div {...fadeUp(0.04)} className="flex flex-col" aria-hidden>
      <div className={cn("grid gap-4 border-b border-border pb-2", gridTemplate)}>
        {columns.map((col) => (
          <Bone
            key={col.key}
            className={cn(
              "h-2.5",
              col.headerClassName ?? "w-14",
              col.headerClassName?.includes("text-right") ? "ml-auto" : "",
            )}
          />
        ))}
      </div>
      {keys.map((key, i) => (
        <div
          key={key}
          className={cn(
            "grid gap-4 border-b border-border py-4 first:border-t animate-pulse",
            gridTemplate,
          )}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {columns.map((col) => (
            <div key={col.key} className={cn(col.cellClassName)}>
              {col.skeleton ?? <Bone className="h-3 w-full max-w-24" />}
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  );
}
