import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import type { NodeInfo, SkillInfo } from "../components/types";
import { detectLang } from "../i18n";
import { useAppStore } from "../store/app";

export async function loadGlobalSkills() {
  const { setSkills, setSkillsLoading, setSkillsError } = useAppStore.getState();
  setSkillsLoading(true);
  setSkillsError(null);
  try {
    const skills = await invoke<SkillInfo[]>("list_skills");
    setSkills(skills);
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
