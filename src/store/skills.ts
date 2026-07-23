import { signal } from "@preact/signals";
import type { SkillInfo, SkillUpdateInfo } from "@/components/types";

export const skills = signal<SkillInfo[]>([]);
export const skillsLoading = signal<boolean>(false);
export const skillsError = signal<string | null>(null);
export const skillUpdates = signal<SkillUpdateInfo[]>([]);
export const updatesLoading = signal<boolean>(false);
export const updatesError = signal<string | null>(null);

export const setSkills = (next: SkillInfo[]) => {
  skills.value = next;
  skillsError.value = null;
};
export const setSkillsLoading = (next: boolean) => {
  skillsLoading.value = next;
};
export const setSkillsError = (next: string | null) => {
  skillsError.value = next;
};
export const setSkillUpdates = (next: SkillUpdateInfo[]) => {
  skillUpdates.value = next;
  updatesError.value = null;
};
export const setUpdatesLoading = (next: boolean) => {
  updatesLoading.value = next;
};
export const setUpdatesError = (next: string | null) => {
  updatesError.value = next;
};

export const skillsStore = {
  skills,
  skillsLoading,
  skillsError,
  skillUpdates,
  updatesLoading,
  updatesError,
  setSkills,
  setSkillsLoading,
  setSkillsError,
  setSkillUpdates,
  setUpdatesLoading,
  setUpdatesError,
};

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
