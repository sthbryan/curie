import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { TableSkeleton } from "./TableSkeleton";
import type { ColumnDef, SortDir, TableProps } from "./types";
import { VirtualTableBody } from "./VirtualTableBody";

export type { ColumnDef, SortDir, TableProps };

export function Table<T>({
  columns,
  rows,
  gridTemplate,
  sortKey,
  sortDir,
  onSort,
  getRowKey,
  loading = false,
  skeletonRows = 6,
  rowHeight,
  viewportClassName,
  footer,
}: TableProps<T>) {
  if (loading) {
    return (
      <TableSkeleton columns={columns} gridTemplate={gridTemplate} skeletonRows={skeletonRows} />
    );
  }

  if (rowHeight) {
    return (
      <VirtualTableBody
        columns={columns}
        rows={rows}
        gridTemplate={gridTemplate}
        rowHeight={rowHeight}
        getRowKey={getRowKey}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        viewportClassName={viewportClassName}
        footer={footer}
      />
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
      <div className="flex flex-col border-t border-border">
        {rows.map((row, i) => (
          <TableRow
            key={getRowKey(row)}
            row={row}
            index={i}
            columns={columns}
            gridTemplate={gridTemplate}
          />
        ))}
      </div>
      {footer}
    </>
  );
}
