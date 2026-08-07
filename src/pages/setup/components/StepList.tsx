import { Check, LoaderCircle } from "lucide-react";
import type { SetupStep } from "@/components/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/motion";

type Props = {
  steps: SetupStep[];
  current: SetupStep;
  manager: string;
};

export function StepList({ steps, current, manager }: Props) {
  const t = useT("setup");
  const shouldReduceMotion = useReducedMotion();
  const currentIndex = steps.indexOf(current);

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const done = currentIndex === -1 || index < currentIndex;
        const active = index === currentIndex;
        return (
          <li
            key={step}
            aria-current={active ? "step" : undefined}
            className="-mt-px flex items-center gap-4 border border-border px-5 py-4 first:mt-0"
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                done && "border-success text-success",
                active && "border-fg-3 text-fg-2",
                !done && !active && "border-border text-fg-4",
              )}
            >
              {done ? (
                <Check size={12} strokeWidth={2} aria-hidden />
              ) : active ? (
                <LoaderCircle
                  size={12}
                  strokeWidth={1.5}
                  aria-hidden
                  className={cn(shouldReduceMotion !== true && "animate-spin")}
                />
              ) : null}
            </span>
            <span
              className={cn(
                "font-body text-sm",
                done || active ? "text-fg" : "text-fg-4",
                active && "font-bold",
              )}
            >
              {t(`steps.${step}`, { manager })}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
