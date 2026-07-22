import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import type { NodeInfo } from "../components/types";
import { detectLang } from "../i18n";
import { useAppStore } from "../store/app";

export function useBoot() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const state = useAppStore.getState();
      if (!state.hasBooted) {
        try {
          const locale = await invoke<string>("get_locale");
          if (!cancelled) state.setLang(detectLang(locale));
        } catch {
          // ignore — fall back to default lang
        }
      }

      try {
        const info = await invoke<NodeInfo>("detect_node");
        if (cancelled) return;
        state.setNode(info);
        state.setStage(info.installed ? "home" : "setup");
      } catch {
        if (!cancelled) state.setStage("setup");
      }

      if (!cancelled) state.markBooted();
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
