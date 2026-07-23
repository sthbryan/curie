import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import type {
  NodeInfo,
  SkillInfo,
  SkillInstallResult,
  SkillSearchResult,
  SkillUpdateInfo,
  SkillUpdateResult,
} from "../components/types";
import { detectLang } from "../i18n";
import { useAppStore } from "../store/app";

function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

let findRequestId = 0;

export async function findSkills(query: string, owner?: string) {
  const q = query.trim();
  const o = owner?.trim() || null;
  const { setFindQuery, setFindOwner, setFindResults, setFindLoading, setFindError } =
    useAppStore.getState();

  setFindQuery(query);
  if (owner !== undefined) setFindOwner(owner);

  if (q.length < 2) {
    findRequestId += 1;
    setFindResults([]);
    setFindError(null);
    setFindLoading(false);
    return;
  }

  const requestId = ++findRequestId;
  setFindLoading(true);
  setFindError(null);
  try {
    const results = await invoke<SkillSearchResult[]>("find_skills", {
      query: q,
      owner: o,
    });
    if (requestId !== findRequestId) return;
    setFindResults(results);
  } catch (e) {
    if (requestId !== findRequestId) return;
    setFindError(errorMessage(e));
    setFindResults([]);
  } finally {
    if (requestId === findRequestId) setFindLoading(false);
  }
}

export async function addSkill(packageName: string) {
  const { setInstallingPackage, setInstallError } = useAppStore.getState();
  setInstallingPackage(packageName);
  setInstallError(null);
  try {
    await invoke<SkillInstallResult>("add_skill", { package: packageName });
    await loadGlobalSkills({ checkUpdates: true });
  } catch (e) {
    setInstallError(errorMessage(e));
    throw e;
  } finally {
    setInstallingPackage(null);
  }
}

export async function checkSkillUpdates() {
  const { setSkillUpdates, setUpdatesLoading, setUpdatesError } = useAppStore.getState();
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
  const { setSkills, setSkillsLoading, setSkillsError } = useAppStore.getState();
  setSkillsLoading(true);
  setSkillsError(null);
  try {
    const skills = await invoke<SkillInfo[]>("list_skills");
    setSkills(skills);
    if (checkUpdates) {
      // Fire-and-forget so the list renders immediately.
      void checkSkillUpdates();
    }
  } catch (e) {
    setSkillsError(errorMessage(e));
  } finally {
    setSkillsLoading(false);
  }
}

export async function updateSkills(names?: string[]) {
  const { setUpdatingSkill, setUpdateApplyError } = useAppStore.getState();
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
}

export function useBoot() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { hasBooted, setLang, setNode, setStage, markBooted } = useAppStore.getState();

      if (!hasBooted) {
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
