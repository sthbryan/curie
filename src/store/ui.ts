import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NodeInfo, ReducedMotionPref, Stage, ThemeMode } from "../components/types";
import type { Lang } from "../i18n";

export type UiState = {
  theme: ThemeMode;
  lang: Lang;
  reducedMotion: ReducedMotionPref;
  hasBooted: boolean;
  stage: Extract<Stage, "loading" | "setup" | "home">;
  node: NodeInfo | null;

  setTheme: (theme: ThemeMode) => void;
  setLang: (lang: Lang) => void;
  setReducedMotion: (pref: ReducedMotionPref) => void;
  setStage: (stage: Extract<Stage, "loading" | "setup" | "home">) => void;
  setNode: (node: NodeInfo | null) => void;
  markBooted: () => void;
  completeSetup: (node: NodeInfo) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "dark",
      lang: "en",
      reducedMotion: "system",
      hasBooted: false,
      stage: "loading",
      node: null,

      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setStage: (stage) => set({ stage }),
      setNode: (node) => set({ node }),
      markBooted: () => set({ hasBooted: true }),
      completeSetup: (node) => set({ node, stage: "home" }),
    }),
    {
      name: "curie.ui",
      partialize: (state) => ({
        theme: state.theme,
        lang: state.lang,
        reducedMotion: state.reducedMotion,
        hasBooted: state.hasBooted,
      }),
    },
  ),
);
