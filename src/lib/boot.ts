import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import type { AppUpdateInfo, NodeInfo, SkillInfo, SkillUpdateInfo } from "@/components/types";
import { detectLang } from "@/i18n";
import {
  setSkills,
  setSkillsError,
  setSkillsLoading,
  setSkillUpdates,
  setUpdatesError,
  setUpdatesLoading,
} from "@/store/skills";
import { hasBooted, markBooted, setLang, setNode, setStage } from "@/store/system";
import { setAppUpdate, setAppUpdateError, setAppUpdateLoading } from "@/store/update";

function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

export async function checkAppUpdate() {
  setAppUpdateLoading(true);
  setAppUpdateError(null);
  try {
    const info = await invoke<AppUpdateInfo>("check_app_update");
    setAppUpdate(info);
  } catch (e) {
    setAppUpdateError(errorMessage(e));
  } finally {
    setAppUpdateLoading(false);
  }
}

export async function checkSkillUpdates() {
  setUpdatesLoading(true);
  setUpdatesError(null);
  try {
    const updates = await invoke<SkillUpdateInfo[]>("check_skill_updates");
    setSkillUpdates(updates);
  } catch (e) {
    setUpdatesError(errorMessage(e));
  } finally {
    setUpdatesLoading(false);
  }
}

export async function loadGlobalSkills(options?: { checkUpdates?: boolean }) {
  const checkUpdates = options?.checkUpdates ?? true;
  setSkillsLoading(true);
  setSkillsError(null);
  try {
    const skills = await invoke<SkillInfo[]>("list_skills");
    setSkills(skills);
    if (checkUpdates) {
      void checkSkillUpdates();
    }
  } catch (e) {
    setSkillsError(errorMessage(e));
  } finally {
    setSkillsLoading(false);
  }
}

export function useBoot() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!hasBooted.value) {
        try {
          const locale = await invoke<string>("get_locale");
          if (!cancelled) setLang(detectLang(locale));
        } catch {
          // ignore — fall back to default lang
        }
      }

      try {
        const info = await invoke<NodeInfo>("detect_node");
        if (cancelled) return;
        setNode(info);
        setStage(info.installed ? "home" : "setup");
        if (info.installed) {
          await loadGlobalSkills();
          void checkAppUpdate();
        }
      } catch {
        if (!cancelled) setStage("setup");
      }

      if (!cancelled) markBooted();
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
