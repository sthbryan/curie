import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NodeInfo, Stage, ThemeMode, View } from "../components/types";
import type { Lang } from "../i18n";

export type AppState = {
  theme: ThemeMode;
  lang: Lang;
  hasBooted: boolean;
  view: View;
  stage: Stage;
  node: NodeInfo | null;

  setTheme: (theme: ThemeMode) => void;
  setLang: (lang: Lang) => void;
  setView: (view: View) => void;
  setStage: (stage: Stage) => void;
  setNode: (node: NodeInfo | null) => void;
  markBooted: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "dark",
      lang: "en",
      hasBooted: false,
      view: "home",
      stage: "loading",
      node: null,

      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setView: (view) => set({ view }),
      setStage: (stage) => set({ stage }),
      setNode: (node) => set({ node }),
      markBooted: () => set({ hasBooted: true }),
    }),
    {
      name: "curie.app",
      partialize: (state) => ({
        theme: state.theme,
        lang: state.lang,
        hasBooted: state.hasBooted,
      }),
    },
  ),
);
