import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { NodeInfo, ProgressEvent, SetupPlan, SetupStep } from "@/components/types";
import { t } from "@/i18n";
import { loadSkills } from "@/lib/boot";
import { errorMessage } from "@/lib/errors";
import { lang } from "@/store/system";

export type SetupPhase = "planning" | "idle" | "running" | "done" | "error";

export function useSetup(onComplete: (node: NodeInfo) => void) {
  const [phase, setPhase] = useState<SetupPhase>("planning");
  const [plan, setPlan] = useState<SetupPlan | null>(null);
  const [step, setStep] = useState<SetupStep>("check");
  const [node, setNode] = useState<NodeInfo | null>(null);
  const [error, setError] = useState("");
  const installed = useRef(false);
  const notified = useRef(false);

  const loadPlan = useCallback(async () => {
    setPhase("planning");
    setError("");
    try {
      const next = await invoke<SetupPlan>("plan_node_setup");
      setPlan(next);
      if (next.node.installed) {
        setNode(next.node);
        setPhase("done");
      } else {
        setPhase("idle");
      }
    } catch (e) {
      setPlan(null);
      setError(errorMessage(e));
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const stop = await listen<ProgressEvent>("setup-progress", (event) => {
        const next = event.payload.stage;
        if (next === "error") return;
        setStep(next as SetupStep);
      });
      if (cancelled) stop();
      else unlisten = stop;
    })();
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  const start = useCallback(async () => {
    setPhase("running");
    setStep("check");
    setError("");
    try {
      const ready = await invoke<NodeInfo>("install_node");
      installed.current = true;
      setNode(ready);
      setPhase("done");
    } catch (e) {
      setError(errorMessage(e));
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (phase !== "done" || !installed.current || notified.current) return;
    notified.current = true;
    toast.success(t(lang.value, "toast.nodeInstalled"));
  }, [phase]);

  const complete = useCallback(async () => {
    try {
      const ready = node?.installed ? node : await invoke<NodeInfo>("detect_node");
      if (!ready.installed) throw new Error(t(lang.value, "setup.errorHint"));
      toast.success(t(lang.value, "toast.setupComplete"));
      onComplete(ready);
      loadSkills().catch(() => {
        // the skills store surfaces its own error state
      });
    } catch (e) {
      setError(errorMessage(e));
      setPhase("error");
    }
  }, [node, onComplete]);

  return { phase, plan, step, node, error, start, complete, retry: loadPlan };
}
