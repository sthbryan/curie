import { useRef } from "react";
import { cn } from "@/lib/cn";
import { useVirtualRows } from "@/lib/useVirtualRows";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import type { ColumnDef, SortDir } from "./types";

type Props<T> = {
  columns: ColumnDef<T>[];
  rows: T[];
  gridTemplate: string;
  rowHeight: number;
  getRowKey: (row: T) => string;
  sortKey?: string;
  sortDir?: SortDir;
  onSort?: (key: string) => void;
  viewportClassName?: string;
};

export function VirtualTableBody<T>({
  columns,
  rows,
  gridTemplate,
  rowHeight,
  getRowKey,
  sortKey,
  sortDir,
  onSort,
  viewportClassName,
}: Props<T>) {
  const viewport = useRef<HTMLDivElement>(null);
  const window = useVirtualRows({ count: rows.length, rowHeight, viewport });

  return (
    <div ref={viewport} className={cn("min-h-0 flex-1 overflow-y-auto", viewportClassName)}>
      <div className="sticky top-0 z-10 bg-bg">
        <TableHeader
          columns={columns}
          gridTemplate={gridTemplate}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
        />
      </div>
      <div style={{ paddingTop: window.padTop, paddingBottom: window.padBottom }}>
        {rows.slice(window.start, window.end).map((row, i) => (
          <TableRow
            key={getRowKey(row)}
            row={row}
            index={window.start + i}
            columns={columns}
            gridTemplate={gridTemplate}
            height={rowHeight}
          />
        ))}
      </div>
    </div>
  );
}
