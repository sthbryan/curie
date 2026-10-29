import { batch, computed, effect, signal } from "@preact/signals";

import type {
  ColorMode,
  ColorScheme,
  NodeInfo,
  ReducedMotionPref,
  Stage,
  ThemeFamily,
} from "@/components/types";
import { THEME_OPTIONS } from "@/components/types";
import type { Lang } from "@/i18n";
import { loadPartial, savePartial } from "@/lib/persistence";
import { type SettingsPatch, writeSettings } from "@/lib/settings";

const WRITE_DELAY = 200;

const STORAGE_KEY = "curie.system";

const stored = loadPartial(STORAGE_KEY, {
  theme: "curie",
  colorMode: "auto",
  sidebarOpen: false,
  lang: "en",
  reducedMotion: "user",
  hasBooted: false,
});

// Older builds stored palettes this list no longer has (`light`, `default`).
const initial = {
  ...stored,
  theme: THEME_OPTIONS.some((option) => option.id === stored.theme) ? stored.theme : "curie",
};

const prefersDark = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : true;

export const systemDark = signal<boolean>(prefersDark());

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (event) => {
    systemDark.value = event.matches;
  });
}

export const theme = signal<ThemeFamily>(initial.theme);
export const colorMode = signal<ColorMode>(initial.colorMode);
export const sidebarOpen = signal<boolean>(initial.sidebarOpen);
// What the palette attribute actually resolves to once `auto` is considered.
export const resolvedMode = computed<ColorScheme>(() =>
  colorMode.value === "auto" ? (systemDark.value ? "dark" : "light") : colorMode.value,
);
export const lang = signal<Lang>(initial.lang);
export const reducedMotion = signal<ReducedMotionPref>(initial.reducedMotion);
export const hasBooted = signal<boolean>(initial.hasBooted);
export const stage = signal<Extract<Stage, "loading" | "setup" | "home">>("loading");
export const node = signal<NodeInfo | null>(null);

export const setTheme = (next: ThemeFamily) => {
  theme.value = next;
};
export const setColorMode = (next: ColorMode) => {
  colorMode.value = next;
};
export const setSidebarOpen = (next: boolean) => {
  sidebarOpen.value = next;
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
    colorMode.value = next.colorMode;
    sidebarOpen.value = next.sidebarOpen;
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
  colorMode: colorMode.value,
  sidebarOpen: sidebarOpen.value,
  lang: lang.value,
  reducedMotion: reducedMotion.value,
  hasBooted: hasBooted.value,
});

export const systemStore = {
  theme,
  colorMode,
  sidebarOpen,
  resolvedMode,
  lang,
  reducedMotion,
  hasBooted,
  stage,
  node,
  setTheme,
  setColorMode,
  setSidebarOpen,
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
  theme: ThemeFamily;
  colorMode: ColorMode;
  sidebarOpen: boolean;
  resolvedMode: ColorScheme;
  lang: Lang;
  reducedMotion: ReducedMotionPref;
  hasBooted: boolean;
  stage: Extract<Stage, "loading" | "setup" | "home">;
  node: NodeInfo | null;
};

export type SystemActions = {
  setTheme: (theme: ThemeFamily) => void;
  setColorMode: (mode: ColorMode) => void;
  setSidebarOpen: (open: boolean) => void;
  setLang: (lang: Lang) => void;
  setReducedMotion: (pref: ReducedMotionPref) => void;
  setStage: (stage: Extract<Stage, "loading" | "setup" | "home">) => void;
  setNode: (node: NodeInfo | null) => void;
  markBooted: () => void;
  completeSetup: (node: NodeInfo) => void;
};

export type SystemStore = SystemState & SystemActions;
