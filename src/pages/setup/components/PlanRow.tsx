import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  icon: LucideIcon;
  title: string;
  hint: ReactNode;
  chip: string;
  chipClassName?: string;
};

export function PlanRow({ icon: Icon, title, hint, chip, chipClassName = "" }: Props) {
  return (
    <div className="-mt-px flex items-start gap-5 border border-border bg-surface-tint px-5 py-4 first:mt-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border-strong text-fg-2">
        <Icon size={15} strokeWidth={1.5} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-body text-sm font-bold text-fg">{title}</span>
        <span className="break-all font-body text-sm text-fg-3">{hint}</span>
      </div>
      <span
        className={cn(
          "ml-auto shrink-0 font-mono uppercase tracking-label text-micro text-fg-4",
          chipClassName,
        )}
      >
        {chip}
      </span>
    </div>
  );
}
