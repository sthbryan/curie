import type { ReactNode } from "react";
import { Heading } from "@/components/Heading";
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
        <Heading as="h3" className="text-xl">
          {title}
        </Heading>
        <p className="font-body text-sm text-fg-3 max-w-lg">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
