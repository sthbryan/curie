import { signal } from "@preact/signals";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import type { SortDir } from "@/components/Table";
import type { SkillRemoveResult, SkillUpdateResult } from "@/components/types";
import { t } from "@/i18n";
import { loadSkills } from "@/lib/boot";
import { errorMessage } from "@/lib/errors";
import { lang } from "@/store/system";
import type { SortField } from "../lib/query";

// ─── Sorting ─────────────────────────────────────────────────────────────────

export const sortKey = signal<SortField>("updated");
export const sortDir = signal<SortDir>("desc");

const ASCENDING_FIRST: SortField[] = ["name", "source"];

export const setSort = (key: SortField) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    return;
  }
  sortKey.value = key;
  sortDir.value = ASCENDING_FIRST.includes(key) ? "asc" : "desc";
};

// ─── Filters ─────────────────────────────────────────────────────────────────

export const QUERY_DEBOUNCE_MS = 150;

export const queryInput = signal<string>("");
export const query = signal<string>("");
export const agentFilter = signal<string | null>(null);
export const updatesOnly = signal<boolean>(false);

let queryTimer: ReturnType<typeof setTimeout> | null = null;

export const setQuery = (next: string) => {
  queryInput.value = next;
  if (queryTimer) clearTimeout(queryTimer);
  queryTimer = setTimeout(() => {
    query.value = next;
    queryTimer = null;
  }, QUERY_DEBOUNCE_MS);
};

export const setAgentFilter = (label: string | null) => {
  agentFilter.value = label;
};

export const toggleUpdatesOnly = () => {
  updatesOnly.value = !updatesOnly.value;
};

export const clearFilters = () => {
  if (queryTimer) clearTimeout(queryTimer);
  queryTimer = null;
  queryInput.value = "";
  query.value = "";
  agentFilter.value = null;
  updatesOnly.value = false;
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
    toast.success(t(lang.value, "toast.updated", { name: names?.length === 1 ? names[0] : "" }));
    await loadSkills(null, { checkUpdates: true });
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
    const removedName = names.length === 1 ? names[0] : null;
    toast.success(t(lang.value, "toast.removed", removedName ? { name: removedName } : undefined));
    await loadSkills(null, { checkUpdates: true });
  } catch (e) {
    removeError.value = errorMessage(e);
    throw e;
  } finally {
    removingSkill.value = null;
  }
};

export const removeAll = async () => {
  removingSkill.value = "*";
  removeError.value = null;
  try {
    await invoke<SkillRemoveResult>("remove_all_skills");
    toast.success(t(lang.value, "toast.removedAll"));
    clearFilters();
    await loadSkills(null, { checkUpdates: true });
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
