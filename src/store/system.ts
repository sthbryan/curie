import { batch, effect, signal } from "@preact/signals";
import type { NodeInfo, ReducedMotionPref, Stage, ThemeMode } from "@/components/types";
import type { Lang } from "@/i18n";
import { loadPartial, savePartial } from "@/lib/persistence";
import { type SettingsPatch, writeSettings } from "@/lib/settings";

const WRITE_DELAY = 200;

const STORAGE_KEY = "curie.system";

const initial = loadPartial(STORAGE_KEY, {
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

let hydrated = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let pending: Promise<void> | null = null;

export const applySettings = (next: SettingsPatch) => {
  batch(() => {
    theme.value = next.theme;
    lang.value = next.lang;
    reducedMotion.value = next.reducedMotion;
    hasBooted.value = next.hasBooted;
  });
};

export const markHydrated = () => {
  hydrated = true;
};

export const flushSettings = async () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    pending = writeSettings(snapshot()).catch(() => {});
  }
  await pending;
};

export const resetSettingsPersistence = () => {
  if (timer) clearTimeout(timer);
  timer = null;
  pending = null;
  hydrated = false;
};

const snapshot = (): SettingsPatch => ({
  theme: theme.value,
  lang: lang.value,
  reducedMotion: reducedMotion.value,
  hasBooted: hasBooted.value,
});

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
  const next = snapshot();
  savePartial(STORAGE_KEY, next);
  if (!hydrated) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    pending = writeSettings(next).catch(() => {});
  }, WRITE_DELAY);
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
