import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "preact/hooks";
import type { SkillDetection } from "@/components/types";

export type DetectionState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; detection: SkillDetection }
  | { kind: "empty" }
  | { kind: "error"; message: string };

const DEBOUNCE_MS = 600;

export function useSkillDetection(input: string | null): DetectionState {
  const [state, setState] = useState<DetectionState>({ kind: "idle" });

  useEffect(() => {
    if (!input) {
      setState({ kind: "idle" });
      return;
    }

    let cancelled = false;
    setState({ kind: "checking" });

    const handle = setTimeout(() => {
      void (async () => {
        try {
          const detection = await invoke<SkillDetection>("detect_skill", {
            package: input,
          });
          if (cancelled) return;
          if (detection.isSkill && detection.skills.length > 0) {
            setState({ kind: "ok", detection });
          } else {
            setState({ kind: "empty" });
          }
        } catch (e) {
          if (cancelled) return;
          const message = e instanceof Error ? e.message : String(e);
          setState({ kind: "error", message });
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [input]);

  return state;
}
