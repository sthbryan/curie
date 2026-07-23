import { effect, signal } from "@preact/signals";
import type { NodeInfo, ReducedMotionPref, Stage, ThemeMode } from "@/components/types";
import type { Lang } from "@/i18n";

const STORAGE_KEY = "curie.ui";
type Persisted = {
  theme: ThemeMode;
  lang: Lang;
  reducedMotion: ReducedMotionPref;
  hasBooted: boolean;
};

function loadPartial(fallback: Persisted): Persisted {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Partial<Persisted>;
    return { ...fallback, ...data };
  } catch {
    return fallback;
  }
}

function savePartial(next: Persisted) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

const initial = loadPartial({
  theme: "dark",
  lang: "en",
  reducedMotion: "user",
  hasBooted: false,
});

export const theme = signal<ThemeMode>(initial.theme);
export const lang = signal<Lang>(initial.lang);
export const reducedMotion = signal<ReducedMotionPref>(initial.reducedMotion);
export const hasBooted = signal<boolean>(initial.hasBooted);
export const stage = signal<Extract<Stage, "loading" | "setup" | "home">>("loading");
export const node = signal<NodeInfo | null>(null);

export const setTheme = (next: ThemeMode) => {
  theme.value = next;
};
export const setLang = (next: Lang) => {
  lang.value = next;
};
export const setReducedMotion = (next: ReducedMotionPref) => {
  reducedMotion.value = next;
};
export const setStage = (next: Extract<Stage, "loading" | "setup" | "home">) => {
  stage.value = next;
};
export const setNode = (next: NodeInfo | null) => {
  node.value = next;
};
export const markBooted = () => {
  hasBooted.value = true;
};
export const completeSetup = (n: NodeInfo) => {
  node.value = n;
  stage.value = "home";
};

export const systemStore = {
  theme,
  lang,
  reducedMotion,
  hasBooted,
  stage,
  node,
  setTheme,
  setLang,
  setReducedMotion,
  setStage,
  setNode,
  markBooted,
  completeSetup,
};

effect(() => {
  savePartial({
    theme: theme.value,
    lang: lang.value,
    reducedMotion: reducedMotion.value,
    hasBooted: hasBooted.value,
  });
});

export type SystemState = {
  theme: ThemeMode;
  lang: Lang;
  reducedMotion: ReducedMotionPref;
  hasBooted: boolean;
  stage: Extract<Stage, "loading" | "setup" | "home">;
  node: NodeInfo | null;
};

export type SystemActions = {
  setTheme: (theme: ThemeMode) => void;
  setLang: (lang: Lang) => void;
  setReducedMotion: (pref: ReducedMotionPref) => void;
  setStage: (stage: Extract<Stage, "loading" | "setup" | "home">) => void;
  setNode: (node: NodeInfo | null) => void;
  markBooted: () => void;
  completeSetup: (node: NodeInfo) => void;
};

export type SystemStore = SystemState & SystemActions;
