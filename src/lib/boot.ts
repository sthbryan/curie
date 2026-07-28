import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import type {
  AppUpdateInfo,
  InstallResult,
  NodeInfo,
  SkillInfo,
  SkillUpdateInfo,
} from "@/components/types";
import { detectLang } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import { loadProjects } from "@/lib/projects";
import {
  setSkills,
  setSkillsError,
  setSkillsLoading,
  setSkillUpdates,
  setUpdatesError,
  setUpdatesLoading,
} from "@/store/skills";
import { hasBooted, markBooted, setLang, setNode, setStage } from "@/store/system";
import {
  setAppInstallRunning,
  setAppUpdate,
  setAppUpdateError,
  setAppUpdateLoading,
} from "@/store/update";

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

export async function installAppUpdate(): Promise<InstallResult | null> {
  setAppInstallRunning(true);
  try {
    return await invoke<InstallResult>("install_app_update");
  } catch (e) {
    return {
      success: false,
      message: errorMessage(e),
      fallbackUrl: "https://github.com/sthbryan/curie/releases/latest",
    };
  } finally {
    setAppInstallRunning(false);
  }
}

let loadToken = 0;
let updatesToken = 0;

export async function checkSkillUpdates(projectPath: string | null = null) {
  const token = ++updatesToken;
  setUpdatesLoading(true);
  setUpdatesError(null);
  try {
    const updates = await invoke<SkillUpdateInfo[]>("check_skill_updates", { projectPath });
    if (token !== updatesToken) return;
    setSkillUpdates(updates);
  } catch (e) {
    if (token !== updatesToken) return;
    setUpdatesError(errorMessage(e));
  } finally {
    if (token === updatesToken) setUpdatesLoading(false);
  }
}

export async function loadSkills(
  projectPath: string | null = null,
  options?: { checkUpdates?: boolean },
) {
  const token = ++loadToken;
  const checkUpdates = options?.checkUpdates ?? true;
  setSkillsLoading(true);
  setSkillsError(null);
  try {
    const skills = await invoke<SkillInfo[]>("list_skills", { projectPath });
    if (token !== loadToken) return;
    setSkills(skills);
    if (checkUpdates) {
      void checkSkillUpdates(projectPath);
    }
  } catch (e) {
    if (token !== loadToken) return;
    setSkillsError(errorMessage(e));
  } finally {
    if (token === loadToken) setSkillsLoading(false);
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
          void loadProjects();
          await loadSkills();
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
