import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
};

export function Row({ label, children }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-border py-4">
      <span className="font-body text-sm text-fg">{label}</span>
      <div className="flex items-center">{children}</div>
    </div>
  );
}
