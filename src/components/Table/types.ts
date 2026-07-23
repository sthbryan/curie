import type { ReactNode } from "react";

export type SortDir = "asc" | "desc";

export type ColumnDef<T> = {
  key: string;
  header: string;
  headerClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
  cell: (row: T, index: number) => ReactNode;
  skeleton?: ReactNode;
};

export type TableProps<T> = {
  columns: ColumnDef<T>[];
  rows: T[];
  gridTemplate: string;
  sortKey?: string;
  sortDir?: SortDir;
  onSort?: (key: string) => void;
  bodyKey?: string;
  getRowKey: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
};
