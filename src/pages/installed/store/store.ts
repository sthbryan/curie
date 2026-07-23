import { signal } from "@preact/signals";
import { invoke } from "@tauri-apps/api/core";
import type { SortDir } from "@/components/Table";
import type { SkillRemoveResult, SkillUpdateResult } from "@/components/types";
import { loadGlobalSkills } from "@/lib/boot";

function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

export type SortField = "name" | "source" | "agents" | "updated";

export const sortKey = signal<SortField>("updated");
export const sortDir = signal<SortDir>("desc");

export const setSort = (key: SortField) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "desc";
  }
};

// ─── Filters ─────────────────────────────────────────────────────────────────

export const query = signal<string>("");
export const agentFilter = signal<string | null>(null);
export const updatesOnly = signal<boolean>(false);

export const setQuery = (q: string) => {
  query.value = q;
};
export const setAgentFilter = (label: string | null) => {
  agentFilter.value = label;
};
export const toggleUpdatesOnly = () => {
  updatesOnly.value = !updatesOnly.value;
  agentFilter.value = null;
};
export const clearFilters = () => {
  agentFilter.value = null;
  updatesOnly.value = false;
};

export type InstalledFiltersState = {
  query: string;
  agentFilter: string | null;
  updatesOnly: boolean;
};

// ─── Actions (update / remove) ──────────────────────────────────────────────

export const updatingSkill = signal<string | null>(null);
export const updateApplyError = signal<string | null>(null);
export const removingSkill = signal<string | null>(null);
export const removeError = signal<string | null>(null);

export const update = async (names?: string[]) => {
  const token = names?.length === 1 ? (names[0] ?? "*") : "*";
  updatingSkill.value = token;
  updateApplyError.value = null;
  try {
    await invoke<SkillUpdateResult>("update_skills", {
      skills: names && names.length > 0 ? names : null,
    });
    await loadGlobalSkills({ checkUpdates: true });
  } catch (e) {
    updateApplyError.value = errorMessage(e);
    throw e;
  } finally {
    updatingSkill.value = null;
  }
};

export const remove = async (names: string[]) => {
  if (names.length === 0) return;
  removingSkill.value = names.length === 1 ? (names[0] ?? null) : "*";
  removeError.value = null;
  try {
    await invoke<SkillRemoveResult>("remove_skills", { skills: names });
    await loadGlobalSkills({ checkUpdates: true });
  } catch (e) {
    removeError.value = errorMessage(e);
    throw e;
  } finally {
    removingSkill.value = null;
  }
};

export const dismissErrors = () => {
  updateApplyError.value = null;
  removeError.value = null;
};

export type InstalledActionsState = {
  updatingSkill: string | null;
  updateApplyError: string | null;
  removingSkill: string | null;
  removeError: string | null;
};
