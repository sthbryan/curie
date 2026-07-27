import { motion } from "motion/react";
import type { ReactNode } from "react";
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
        <motion.section {...fadeUp(0)} className="flex flex-col gap-3">
          <Label className={eyebrowClassName}>{eyebrow}</Label>
          <h2 className="max-w-xl font-display text-heading font-bold tracking-tight text-fg">
            {title}
          </h2>
          <p className="max-w-xl font-body text-base text-fg-3">{subtitle}</p>
        </motion.section>

        <motion.div {...fadeUp(0.05)} className="flex flex-col gap-10">
          {children}
        </motion.div>
      </div>
    </main>
  );
}
