import { ChevronDown, ChevronUp } from "lucide-react";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import type { ColumnDef, SortDir } from "./types";

type Props<T> = {
  columns: ColumnDef<T>[];
  gridTemplate: string;
  sortKey?: string;
  sortDir?: SortDir;
  onSort?: (key: string) => void;
};

const CELL = "font-mono uppercase tracking-label text-micro text-fg-4";

export function TableHeader<T>({ columns, gridTemplate, sortKey, sortDir, onSort }: Props<T>) {
  const t = useT("app");

  return (
    <div className={cn("grid gap-4 border-b border-border pb-2", gridTemplate)}>
      {columns.map((col) => {
        const active = sortKey === col.key;
        const state = active ? t(sortDir === "asc" ? "sortedAsc" : "sortedDesc") : t("sortable");

        if (!col.sortable) {
          return (
            <span key={col.key} className={cn(CELL, col.headerClassName)}>
              {col.header}
            </span>
          );
        }

        return (
          <button
            key={col.key}
            type="button"
            aria-label={`${col.header} · ${state}`}
            onClick={() => onSort?.(col.key)}
            className={cn(
              CELL,
              "inline-flex cursor-pointer select-none items-center gap-1 transition-colors hover:text-fg",
              active && "text-fg-2",
              col.headerClassName?.includes("text-right") && "justify-end",
              col.headerClassName,
            )}
          >
            {col.header}
            <span className="inline-flex w-3 justify-center" aria-hidden>
              {active ? (
                sortDir === "asc" ? (
                  <ChevronUp size={11} strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={11} strokeWidth={2.5} />
                )
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
