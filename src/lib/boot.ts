import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import type { NodeInfo, SkillInfo, SkillUpdateInfo } from "../components/types";
import { detectLang } from "../i18n";
import { useAppStore } from "../store/app";

export async function checkSkillUpdates() {
  const { setSkillUpdates, setUpdatesLoading, setUpdatesError } = useAppStore.getState();
  setUpdatesLoading(true);
  setUpdatesError(null);
  try {
    const updates = await invoke<SkillUpdateInfo[]>("check_skill_updates");
    setSkillUpdates(updates);
  } catch (e) {
    const message = typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
    setUpdatesError(message);
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
    const message = typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
    setSkillsError(message);
  } finally {
    setSkillsLoading(false);
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
