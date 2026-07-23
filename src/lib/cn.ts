import { type ClassValue, clsx } from "cnfast";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * cnfast/twMerge only treat t-shirt sizes (xs/sm/…) as font-size under `text-*`.
 * Our Curie tokens (`text-micro`, `text-mono`, …) and theme colors (`text-fg-3`,
 * `text-accent`, …) all look like the same `text-*` group, so one drops the other.
 * That is why `text-micro!` was needed. Teach the merger about our tokens instead.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-micro",
        "text-mono",
        "text-body",
        "text-heading",
        "text-display",
        "text-kpi",
      ],
      "text-color": [
        "text-fg",
        "text-fg-2",
        "text-fg-3",
        "text-fg-4",
        "text-bg",
        "text-surface",
        "text-surface-hover",
        "text-surface-tint",
        "text-border",
        "text-border-strong",
        "text-accent",
        "text-accent-fg",
        "text-success",
        "text-success-fg",
      ],
      tracking: ["tracking-label", "tracking-display"],
      "font-family": ["font-display", "font-body", "font-mono"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type { ClassValue };
