import type { ReactNode } from "react";

export function TableLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono uppercase tracking-label text-micro text-fg-4">{children}</span>
  );
}
