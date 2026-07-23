import { create } from "zustand";
import type { SkillInfo, SkillUpdateInfo } from "@/components/types";

export type SkillsState = {
  skills: SkillInfo[];
  skillsLoading: boolean;
  skillsError: string | null;
  skillUpdates: SkillUpdateInfo[];
  updatesLoading: boolean;
  updatesError: string | null;
};

export type SkillsActions = {
  setSkills: (skills: SkillInfo[]) => void;
  setSkillsLoading: (loading: boolean) => void;
  setSkillsError: (error: string | null) => void;
  setSkillUpdates: (updates: SkillUpdateInfo[]) => void;
  setUpdatesLoading: (loading: boolean) => void;
  setUpdatesError: (error: string | null) => void;
};

export type SkillsStore = SkillsState & SkillsActions;

export const useSkillsStore = create<SkillsStore>()((set) => ({
  skills: [],
  skillsLoading: false,
  skillsError: null,
  skillUpdates: [],
  updatesLoading: false,
  updatesError: null,

  setSkills: (skills) => set({ skills, skillsError: null }),
  setSkillsLoading: (skillsLoading) => set({ skillsLoading }),
  setSkillsError: (skillsError) => set({ skillsError }),
  setSkillUpdates: (skillUpdates) => set({ skillUpdates, updatesError: null }),
  setUpdatesLoading: (updatesLoading) => set({ updatesLoading }),
  setUpdatesError: (updatesError) => set({ updatesError }),
}));
