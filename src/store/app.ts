import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  NodeInfo,
  ReducedMotionPref,
  SkillInfo,
  SkillSearchResult,
  SkillUpdateInfo,
  Stage,
  ThemeMode,
  View,
} from "../components/types";
import type { Lang } from "../i18n";

export type AppState = {
  theme: ThemeMode;
  lang: Lang;
  reducedMotion: ReducedMotionPref;
  hasBooted: boolean;
  view: View;
  stage: Extract<Stage, "loading" | "setup" | "home">;
  node: NodeInfo | null;
  skills: SkillInfo[];
  skillsLoading: boolean;
  skillsError: string | null;
  skillUpdates: SkillUpdateInfo[];
  updatesLoading: boolean;
  updatesError: string | null;
  updatingSkill: string | null;
  updateApplyError: string | null;
  findQuery: string;
  findOwner: string;
  findResults: SkillSearchResult[];
  findLoading: boolean;
  findError: string | null;
  installingPackage: string | null;
  installError: string | null;

  setTheme: (theme: ThemeMode) => void;
  setLang: (lang: Lang) => void;
  setReducedMotion: (pref: ReducedMotionPref) => void;
  setView: (view: View) => void;
  setStage: (stage: Extract<Stage, "loading" | "setup" | "home">) => void;
  setNode: (node: NodeInfo | null) => void;
  setSkills: (skills: SkillInfo[]) => void;
  setSkillsLoading: (loading: boolean) => void;
  setSkillsError: (error: string | null) => void;
  setSkillUpdates: (updates: SkillUpdateInfo[]) => void;
  setUpdatesLoading: (loading: boolean) => void;
  setUpdatesError: (error: string | null) => void;
  setUpdatingSkill: (name: string | null) => void;
  setUpdateApplyError: (error: string | null) => void;
  setFindQuery: (query: string) => void;
  setFindOwner: (owner: string) => void;
  setFindResults: (results: SkillSearchResult[]) => void;
  setFindLoading: (loading: boolean) => void;
  setFindError: (error: string | null) => void;
  setInstallingPackage: (pkg: string | null) => void;
  setInstallError: (error: string | null) => void;
  markBooted: () => void;
  completeSetup: (node: NodeInfo) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "dark",
      lang: "en",
      reducedMotion: "system",
      hasBooted: false,
      view: "home",
      stage: "loading",
      node: null,
      skills: [],
      skillsLoading: false,
      skillsError: null,
      skillUpdates: [],
      updatesLoading: false,
      updatesError: null,
      updatingSkill: null,
      updateApplyError: null,
      findQuery: "",
      findOwner: "",
      findResults: [],
      findLoading: false,
      findError: null,
      installingPackage: null,
      installError: null,

      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setView: (view) => set({ view }),
      setStage: (stage) => set({ stage }),
      setNode: (node) => set({ node }),
      setSkills: (skills) => set({ skills, skillsError: null }),
      setSkillsLoading: (skillsLoading) => set({ skillsLoading }),
      setSkillsError: (skillsError) => set({ skillsError }),
      setSkillUpdates: (skillUpdates) => set({ skillUpdates, updatesError: null }),
      setUpdatesLoading: (updatesLoading) => set({ updatesLoading }),
      setUpdatesError: (updatesError) => set({ updatesError }),
      setUpdatingSkill: (updatingSkill) => set({ updatingSkill }),
      setUpdateApplyError: (updateApplyError) => set({ updateApplyError }),
      setFindQuery: (findQuery) => set({ findQuery }),
      setFindOwner: (findOwner) => set({ findOwner }),
      setFindResults: (findResults) => set({ findResults, findError: null }),
      setFindLoading: (findLoading) => set({ findLoading }),
      setFindError: (findError) => set({ findError }),
      setInstallingPackage: (installingPackage) => set({ installingPackage }),
      setInstallError: (installError) => set({ installError }),
      markBooted: () => set({ hasBooted: true }),
      completeSetup: (node) => set({ node, view: "home", stage: "home" }),
    }),
    {
      name: "curie.app",
      partialize: (state) => ({
        theme: state.theme,
        lang: state.lang,
        reducedMotion: state.reducedMotion,
        hasBooted: state.hasBooted,
      }),
    },
  ),
);
