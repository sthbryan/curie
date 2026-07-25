import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  id: string;
  label: string;
  hideLabel?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ id, label, hideLabel = false, className, children }: Props) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          hideLabel ? "sr-only" : "font-mono uppercase tracking-label text-micro text-fg-4",
        )}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
