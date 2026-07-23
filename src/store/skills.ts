import { create } from "zustand";
import type { SkillInfo, SkillUpdateInfo } from "@/components/types";

export type SkillsState = {
  skills: SkillInfo[];
  skillsLoading: boolean;
  skillsError: string | null;
  skillUpdates: SkillUpdateInfo[];
  updatesLoading: boolean;
  updatesError: string | null;
  updatingSkill: string | null;
  updateApplyError: string | null;
  /** Skill name currently being removed (or "*" for bulk). */
  removingSkill: string | null;
  removeError: string | null;

  setSkills: (skills: SkillInfo[]) => void;
  setSkillsLoading: (loading: boolean) => void;
  setSkillsError: (error: string | null) => void;
  setSkillUpdates: (updates: SkillUpdateInfo[]) => void;
  setUpdatesLoading: (loading: boolean) => void;
  setUpdatesError: (error: string | null) => void;
  setUpdatingSkill: (name: string | null) => void;
  setUpdateApplyError: (error: string | null) => void;
  setRemovingSkill: (name: string | null) => void;
  setRemoveError: (error: string | null) => void;
};

export const useSkillsStore = create<SkillsState>()((set) => ({
  skills: [],
  skillsLoading: false,
  skillsError: null,
  skillUpdates: [],
  updatesLoading: false,
  updatesError: null,
  updatingSkill: null,
  updateApplyError: null,
  removingSkill: null,
  removeError: null,

  setSkills: (skills) => set({ skills, skillsError: null }),
  setSkillsLoading: (skillsLoading) => set({ skillsLoading }),
  setSkillsError: (skillsError) => set({ skillsError }),
  setSkillUpdates: (skillUpdates) => set({ skillUpdates, updatesError: null }),
  setUpdatesLoading: (updatesLoading) => set({ updatesLoading }),
  setUpdatesError: (updatesError) => set({ updatesError }),
  setUpdatingSkill: (updatingSkill) => set({ updatingSkill }),
  setUpdateApplyError: (updateApplyError) => set({ updateApplyError }),
  setRemovingSkill: (removingSkill) => set({ removingSkill }),
  setRemoveError: (removeError) => set({ removeError }),
}));
