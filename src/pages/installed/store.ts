import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import type { SkillRemoveResult, SkillUpdateResult } from "@/components/types";
import { loadGlobalSkills } from "@/lib/boot";

// ─── Filters ─────────────────────────────────────────────────────────────────

export type InstalledFiltersState = {
  query: string;
  agentFilter: string | null;
  updatesOnly: boolean;

  setQuery: (q: string) => void;
  setAgentFilter: (label: string | null) => void;
  toggleUpdatesOnly: () => void;
  clearFilters: () => void;
};

export const useInstalledFiltersStore = create<InstalledFiltersState>()((set) => ({
  query: "",
  agentFilter: null,
  updatesOnly: false,

  setQuery: (query) => set({ query }),
  setAgentFilter: (agentFilter) => set({ agentFilter }),
  toggleUpdatesOnly: () => set({ updatesOnly: true, agentFilter: null }),
  clearFilters: () => set({ agentFilter: null, updatesOnly: false }),
}));

// ─── Actions (update / remove) ──────────────────────────────────────────────

function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

export type InstalledActionsState = {
  updatingSkill: string | null;
  updateApplyError: string | null;
  removingSkill: string | null;
  removeError: string | null;

  update: (names?: string[]) => Promise<void>;
  remove: (names: string[]) => Promise<void>;
  dismissErrors: () => void;
};

export const useInstalledActionsStore = create<InstalledActionsState>()((set) => ({
  updatingSkill: null,
  updateApplyError: null,
  removingSkill: null,
  removeError: null,

  update: async (names) => {
    const token = names?.length === 1 ? (names[0] ?? "*") : "*";
    set({ updatingSkill: token, updateApplyError: null });
    try {
      await invoke<SkillUpdateResult>("update_skills", {
        skills: names && names.length > 0 ? names : null,
      });
      await loadGlobalSkills({ checkUpdates: true });
    } catch (e) {
      set({ updateApplyError: errorMessage(e) });
      throw e;
    } finally {
      set({ updatingSkill: null });
    }
  },

  remove: async (names) => {
    if (names.length === 0) return;
    set({ removingSkill: names.length === 1 ? (names[0] ?? null) : "*", removeError: null });
    try {
      await invoke<SkillRemoveResult>("remove_skills", { skills: names });
      await loadGlobalSkills({ checkUpdates: true });
    } catch (e) {
      set({ removeError: errorMessage(e) });
      throw e;
    } finally {
      set({ removingSkill: null });
    }
  },

  dismissErrors: () => set({ updateApplyError: null, removeError: null }),
}));
