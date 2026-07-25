import type { ReactNode } from "react";
import { Label } from "@/components/Label";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function FormSection({ eyebrow, title, subtitle, children }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>{eyebrow}</Label>
        <h3 className="font-display text-xl font-bold tracking-tight text-fg">{title}</h3>
        <p className="font-body text-sm text-fg-3 max-w-lg">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
