import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import {
  type InstallStep,
  type NodeInfo,
  type ProgressEvent,
  STEP_ORDER,
  type Stage,
} from "@/components/types";
import { t as rawT, useT } from "@/i18n";
import { loadGlobalSkills } from "@/lib/boot";
import { cn } from "@/lib/cn";
import { lang } from "@/store/system";

type Props = {
  onComplete: (node: NodeInfo) => void;
};

export function Setup({ onComplete }: Props) {
  const t = useT("setup");
  const [stage, setStage] =
    useState<Extract<Stage, "setup" | "installing" | "done" | "error">>("setup");
  const [step, setStep] = useState<InstallStep>("checking");
  const [manualOpen, setManualOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const notifiedInstall = useRef(false);

  useEffect(() => {
    if (stage !== "installing") return;
    let unlisten: (() => void) | undefined;
    (async () => {
      unlisten = await listen<ProgressEvent>("setup-progress", (event) => {
        const stageName = event.payload.stage as InstallStep;
        if (stageName === "error") {
          setErrorMsg(event.payload.message);
          setStage("error");
        } else {
          setStep(stageName);
          if (stageName === "done") setStage("done");
        }
      });
    })();
    return () => {
      unlisten?.();
    };
  }, [stage]);

  useEffect(() => {
    if (stage === "done" && !notifiedInstall.current) {
      notifiedInstall.current = true;
      toast.success(rawT(lang.value, "toast.nodeInstalled"));
    }
  }, [stage]);

  async function handleInstall() {
    setStage("installing");
    setStep("checking");
    setErrorMsg("");
    try {
      await invoke("install_node");
    } catch (e) {
      setErrorMsg(typeof e === "string" ? e : String(e));
      setStage("error");
    }
  }

  async function handleContinue() {
    try {
      const node = await invoke<NodeInfo>("detect_node");
      if (node.installed) {
        toast.success(rawT(lang.value, "toast.setupComplete"));
        onComplete(node);
        loadGlobalSkills().catch(() => {
          // store handles error state
        });
      } else {
        setStage("error");
        setErrorMsg(t("stages.error"));
      }
    } catch {
      setStage("error");
      setErrorMsg(t("stages.error"));
    }
  }

  async function handleRetry() {
    setStage("setup");
    setErrorMsg("");
  }

  function handleOpenManual() {
    setManualOpen(true);
  }

  function handleToggleManual() {
    setManualOpen((o) => !o);
  }

  if (stage === "installing") {
    return (
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-10 pt-16 pb-8">
          <section className="flex flex-col gap-6">
            <Label className="text-fg-3">{t("progressEyebrow")}</Label>
            <h2 className="font-display text-heading font-bold tracking-tight text-fg">
              {t(`stages.${step}`)}
            </h2>
          </section>

          <hr className="border-0 border-t border-border" />

          <section className="flex flex-col gap-1">
            {STEP_ORDER.map((s) => {
              const currentIdx = STEP_ORDER.indexOf(step);
              const thisIdx = STEP_ORDER.indexOf(s);
              const isDone = thisIdx < currentIdx || step === "done";
              const isCurrent = thisIdx === currentIdx && step !== "done";
              return (
                <div
                  key={s}
                  className="flex items-center gap-4 border-b border-border py-4 first:border-t"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full font-mono text-mono font-bold",
                      {
                        "bg-success text-success-fg": isDone,
                        "border border-fg-3 text-fg-3": isCurrent,
                        "border border-border text-fg-4": !isDone && !isCurrent,
                      },
                    )}
                  >
                    {isDone ? "✓" : isCurrent ? "●" : ""}
                  </span>
                  <span
                    className={cn("font-body text-sm", {
                      "text-fg": isDone || isCurrent,
                      "text-fg-4": !isDone && !isCurrent,
                    })}
                  >
                    {t(`stages.${s}`)}
                  </span>
                </div>
              );
            })}
          </section>
        </div>
      </main>
    );
  }

  if (stage === "done") {
    return (
      <main className="flex min-w-0 flex-1 flex-col items-center justify-center px-10">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
          <Label className="text-success">{t("doneEyebrow")}</Label>
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-display font-bold leading-none tracking-display">✓</h1>
            <h2 className="font-display text-heading font-bold tracking-tight text-fg">
              {t("doneTitle")}
            </h2>
            <p className="font-body text-base text-fg-3 max-w-md mx-auto">{t("doneHint")}</p>
          </div>
          <Button size="xl" variant="primary" className="px-8" onClick={handleContinue}>
            {t("continue")}
          </Button>
        </div>
      </main>
    );
  }

  if (stage === "error") {
    return (
      <main className="flex min-w-0 flex-1 flex-col items-center justify-center px-10">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
          <Label className="text-accent">{t("errorEyebrow")}</Label>
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-heading font-bold tracking-tight text-fg">
              {t("stages.error")}
            </h2>
            <p className="font-body text-sm text-fg-3 max-w-md mx-auto">
              {errorMsg || t("errorHint")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="xl" variant="primary" onClick={handleRetry}>
              {t("retry")}
            </Button>
            <Button size="xl" variant="outline" onClick={handleOpenManual}>
              {t("manual")}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-10 pt-16 pb-8">
        <section className="flex flex-col gap-3">
          <Label className="text-fg-3">{t("eyebrow")}</Label>
          <h2 className="font-display text-heading font-bold tracking-tight text-fg max-w-xl">
            {t("title")}
          </h2>
          <p className="font-body text-base text-fg-3 max-w-xl">{t("subtitle")}</p>
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-5">
          <Label>{t("checklist")}</Label>
          <div className="flex flex-col gap-0">
            <div className="flex items-start gap-5 border border-border bg-surface-tint p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border-strong font-display text-lg font-bold text-fg">
                ⬢
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-body text-sm font-bold text-fg">{t("toolName")}</span>
                <span className="font-body text-sm text-fg-3">{t("toolDesc")}</span>
              </div>
              <div className="flex-1" />
              <span className="font-mono uppercase tracking-label text-micro text-success">
                REQUIRED
              </span>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <p className="font-body text-base text-fg-2">{t("prompt")}</p>
          <div className="flex items-center gap-3">
            <Button size="hero" variant="primary" className="px-8 gap-3" onClick={handleInstall}>
              <span>{t("cta")}</span>
              <span>→</span>
            </Button>
            <Button size="hero" variant="ghost" className="px-6" onClick={handleToggleManual}>
              {t("manual")}
              <span className="ml-2">{manualOpen ? "▴" : "▾"}</span>
            </Button>
          </div>
        </section>

        {manualOpen && (
          <section className="flex flex-col gap-4 border-t border-border pt-6">
            <Label>{t("manualHint")}</Label>
            <pre className="border border-border bg-surface p-4 font-mono text-mono text-fg-2 overflow-x-auto rounded-sm">
              {t("manualCommand")}
            </pre>
            <a
              href="https://volta.sh"
              onClick={(e) => {
                e.preventDefault();
                void Promise.resolve(openUrl("https://volta.sh")).catch(() => {
                  // ignore
                });
              }}
              className="self-start font-mono uppercase tracking-label text-mono text-fg-3 hover:text-fg transition-colors duration-150 cursor-pointer"
            >
              {t("manualLink")}
            </a>
          </section>
        )}
      </div>
    </main>
  );
}
