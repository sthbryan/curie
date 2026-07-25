import { cn } from "@/lib/cn";
import type { ColumnDef } from "./types";

type Props<T> = {
  row: T;
  index: number;
  columns: ColumnDef<T>[];
  gridTemplate: string;
  height?: number;
};

export function TableRow<T>({ row, index, columns, gridTemplate, height }: Props<T>) {
  return (
    <article
      className={cn(
        "grid gap-4 border-b border-border",
        height ? "items-center" : "py-4",
        gridTemplate,
      )}
      style={height ? { height } : undefined}
    >
      {columns.map((col) => (
        <div key={col.key} className={cn(col.cellClassName)}>
          {col.cell(row, index)}
        </div>
      ))}
    </article>
  );
}
