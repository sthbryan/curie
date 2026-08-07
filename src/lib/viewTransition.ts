import { flushSync } from "react-dom";
import { prefersReducedMotion } from "@/lib/motion";

export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && typeof document.startViewTransition === "function";
}

export function markViewTransitionSupport(): void {
  if (typeof document === "undefined") return;
  if (supportsViewTransitions()) {
    document.documentElement.setAttribute("data-view-transitions", "");
  } else {
    document.documentElement.removeAttribute("data-view-transitions");
  }
}

export function withViewTransition(update: () => void): void {
  if (!supportsViewTransitions() || prefersReducedMotion()) {
    update();
    return;
  }

  document.startViewTransition(() => {
    flushSync(update);
  });
}
