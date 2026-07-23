import type { ReducedMotionPref, ThemeMode } from "@/components/types";
import type { Lang } from "@/i18n";

type Persisted = {
  theme: ThemeMode;
  lang: Lang;
  reducedMotion: ReducedMotionPref;
  hasBooted: boolean;
};

export function loadPartial(key: string, fallback: Persisted): Persisted {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Partial<Persisted>;
    return { ...fallback, ...data };
  } catch {
    return fallback;
  }
}

export function savePartial(key: string, next: Persisted) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore
  }
}
