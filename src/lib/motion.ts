import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { reducedMotion } from "@/store/system";

export const easeOut = "cubic-bezier(0.22, 1, 0.36, 1)";

export const duration = {
  fast: 160,
  base: 220,
  slow: 410,
} as const;

export type AnimProps = {
  "data-anim": string;
  style?: CSSProperties;
};

const delayStyle = (delay: number): CSSProperties =>
  ({ "--anim-delay": `${Math.round(delay * 1000)}ms` }) as CSSProperties;

export const fadeUp = (delay = 0): AnimProps => ({
  "data-anim": "fade-up",
  style: delayStyle(delay),
});

export const pageAnim: AnimProps = { "data-anim": "page" };

export const stageAnim: AnimProps = { "data-anim": "stage" };

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

const systemPrefersReduced = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(REDUCE_QUERY).matches;

export function prefersReducedMotion(): boolean {
  const pref = reducedMotion.peek();
  if (pref === "always") return true;
  if (pref === "never") return false;
  return systemPrefersReduced();
}

export function useReducedMotion(): boolean {
  const pref = reducedMotion.value;
  const [system, setSystem] = useState(systemPrefersReduced);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(REDUCE_QUERY);
    const sync = () => setSystem(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  if (pref === "always") return true;
  if (pref === "never") return false;
  return system;
}
