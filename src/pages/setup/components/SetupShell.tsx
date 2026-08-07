import type { ReactNode } from "react";
import { Heading } from "@/components/Heading";
import { Label } from "@/components/Label";
import { fadeUp } from "@/lib/motion";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  eyebrowClassName?: string;
  children: ReactNode;
};

export function SetupShell({ eyebrow, title, subtitle, eyebrowClassName, children }: Props) {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-10 pt-16 pb-10">
        <section {...fadeUp(0)} className="flex flex-col gap-3">
          <Label className={eyebrowClassName}>{eyebrow}</Label>
          <Heading className="max-w-xl">{title}</Heading>
          <p className="max-w-xl font-body text-base text-fg-3">{subtitle}</p>
        </section>

        <div {...fadeUp(0.05)} className="flex flex-col gap-10">
          {children}
        </div>
      </div>
    </main>
  );
}
