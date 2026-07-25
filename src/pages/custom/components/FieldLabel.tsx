import type { ReactNode } from "react";

type Props = {
  htmlFor: string;
  children: ReactNode;
};

export function FieldLabel({ htmlFor, children }: Props) {
  return (
    <label htmlFor={htmlFor} className="font-mono uppercase tracking-label text-micro text-fg-3">
      {children}
    </label>
  );
}
