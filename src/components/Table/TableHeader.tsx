import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { fadeUp } from "@/lib/motion";
import type { ColumnDef, SortDir } from "./types";

type Props<T> = {
  columns: ColumnDef<T>[];
  gridTemplate: string;
  sortKey?: string;
  sortDir?: SortDir;
  onSort?: (key: string) => void;
};

export function TableHeader<T>({ columns, gridTemplate, sortKey, sortDir, onSort }: Props<T>) {
  return (
    <motion.div
      {...fadeUp(0.06)}
      className={cn("grid gap-4 border-b border-border pb-2", gridTemplate)}
    >
      {columns.map((col) => (
        <button
          key={col.key}
          className={cn(
            "font-mono uppercase tracking-label text-micro text-fg-4",
            col.sortable && "cursor-pointer select-none hover:text-fg",
            col.headerClassName,
          )}
          type="button"
          onClick={col.sortable ? () => onSort?.(col.key) : undefined}
          tabIndex={col.sortable ? 0 : undefined}
          onKeyDown={
            col.sortable
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSort?.(col.key);
                  }
                }
              : undefined
          }
        >
          {col.header}
          {sortKey === col.key && <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>}
        </button>
      ))}
    </motion.div>
  );
}
