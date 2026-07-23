import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import type { SkillRemoveResult, SkillUpdateResult } from "@/components/types";
import { loadGlobalSkills } from "@/lib/boot";

function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

export type SkillActions = {
  updatingSkill: string | null;
  updateApplyError: string | null;
  removingSkill: string | null;
  removeError: string | null;
  update: (names?: string[]) => Promise<void>;
  remove: (names: string[]) => Promise<void>;
  dismissErrors: () => void;
};

/**
 * Owns the action state for installing/updating/removing skills, which is
 * only relevant to the Installed page. The shared `useSkillsStore` keeps
 * the data; this hook keeps the transient "what is happening right now"
 * state local.
 */
export function useSkillActions(): SkillActions {
  const [updatingSkill, setUpdatingSkill] = useState<string | null>(null);
  const [updateApplyError, setUpdateApplyError] = useState<string | null>(null);
  const [removingSkill, setRemovingSkill] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const update = useCallback(async (names?: string[]) => {
    const token = names?.length === 1 ? (names[0] ?? "*") : "*";
    setUpdatingSkill(token);
    setUpdateApplyError(null);
    try {
      await invoke<SkillUpdateResult>("update_skills", {
        skills: names && names.length > 0 ? names : null,
      });
      await loadGlobalSkills({ checkUpdates: true });
    } catch (e) {
      setUpdateApplyError(errorMessage(e));
      throw e;
    } finally {
      setUpdatingSkill(null);
    }
  }, []);

  const remove = useCallback(async (names: string[]) => {
    if (names.length === 0) return;
    setRemovingSkill(names.length === 1 ? (names[0] ?? null) : "*");
    setRemoveError(null);
    try {
      await invoke<SkillRemoveResult>("remove_skills", { skills: names });
      await loadGlobalSkills({ checkUpdates: true });
    } catch (e) {
      setRemoveError(errorMessage(e));
      throw e;
    } finally {
      setRemovingSkill(null);
    }
  }, []);

  const dismissErrors = useCallback(() => {
    setUpdateApplyError(null);
    setRemoveError(null);
  }, []);

  return {
    updatingSkill,
    updateApplyError,
    removingSkill,
    removeError,
    update,
    remove,
    dismissErrors,
  };
}
