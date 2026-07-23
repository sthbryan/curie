import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { listItem, listStagger } from "@/lib/motion";
import { TableHeader } from "./TableHeader";
import { TableSkeleton } from "./TableSkeleton";
import type { ColumnDef, SortDir, TableProps } from "./types";

export type { ColumnDef, SortDir, TableProps };

export function Table<T>({
  columns,
  rows,
  gridTemplate,
  sortKey,
  sortDir,
  onSort,
  bodyKey,
  getRowKey,
  loading = false,
  skeletonRows = 6,
}: TableProps<T>) {
  if (loading) {
    return (
      <TableSkeleton columns={columns} gridTemplate={gridTemplate} skeletonRows={skeletonRows} />
    );
  }

  return (
    <>
      <TableHeader
        columns={columns}
        gridTemplate={gridTemplate}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
      />
      <motion.div
        key={bodyKey}
        className="flex flex-col"
        variants={listStagger}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((row, i) => (
            <motion.article
              key={getRowKey(row)}
              layout
              variants={listItem}
              className={cn("grid gap-4 border-b border-border py-4 first:border-t", gridTemplate)}
            >
              {columns.map((col) => (
                <div key={col.key} className={cn(col.cellClassName)}>
                  {col.cell(row, i)}
                </div>
              ))}
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
