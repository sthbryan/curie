import { ArrowRight, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/Button";
import { ErrorNotice } from "@/components/ErrorNotice";
import { FullPageLoading } from "@/components/FullPageLoading";
import type { NodeInfo, SetupStep } from "@/components/types";
import { useT } from "@/i18n";
import { ManualPanel } from "./components/ManualPanel";
import { PlanCard } from "./components/PlanCard";
import { SetupShell } from "./components/SetupShell";
import { StepList } from "./components/StepList";
import { useSetup } from "./hooks/useSetup";
import { managerLabel } from "./lib/managers";

type Props = {
  onComplete: (node: NodeInfo) => void;
};

export function Setup({ onComplete }: Props) {
  const t = useT("setup");
  const { phase, plan, step, node, error, start, complete, retry } = useSetup(onComplete);
  const [manualOpen, setManualOpen] = useState(false);

  if (phase === "planning") {
    return <FullPageLoading label={t("detecting")} />;
  }

  const manager = managerLabel(plan?.manager?.id);
  const steps = (plan?.steps ?? []).filter((s): s is SetupStep => s !== "done");

  if (phase === "running") {
    return (
      <SetupShell
        eyebrow={t("progressEyebrow")}
        title={t("progressTitle")}
        subtitle={t("progressHint")}
      >
        <StepList steps={steps} current={step} manager={manager} />
      </SetupShell>
    );
  }

  if (phase === "done") {
    return (
      <SetupShell
        eyebrow={t("doneEyebrow")}
        title={t("doneTitle")}
        subtitle={t("doneHint", { version: node?.version ?? "" })}
        eyebrowClassName="text-success"
      >
        <div className="flex items-center gap-4">
          <Button size="xl" variant="primary" className="px-8" onClick={() => void complete()}>
            {t("continue")}
            <ArrowRight size={13} strokeWidth={1.5} aria-hidden />
          </Button>
          <span className="inline-flex items-center gap-2 font-mono uppercase tracking-label text-micro text-success">
            <Check size={12} strokeWidth={2} aria-hidden />
            {node?.version ?? ""}
          </span>
        </div>
      </SetupShell>
    );
  }

  if (phase === "error") {
    return (
      <SetupShell
        eyebrow={t("errorEyebrow")}
        title={t("errorTitle")}
        subtitle={t("errorHint")}
        eyebrowClassName="text-error"
      >
        <ErrorNotice
          title={t("errorEyebrow")}
          message={error}
          retryLabel={t("retry")}
          onRetry={() => void retry()}
          onDismiss={() => void retry()}
        />
        {plan ? <ManualPanel command={plan.command} showLink={!plan.manager} /> : null}
      </SetupShell>
    );
  }

  return (
    <SetupShell eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
      {plan ? <PlanCard plan={plan} /> : null}

      <section className="flex items-center gap-3">
        <Button size="hero" variant="primary" className="gap-3 px-8" onClick={() => void start()}>
          {t("cta")}
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
        </Button>
        <Button
          size="hero"
          variant="ghost"
          className="px-6"
          aria-expanded={manualOpen}
          onClick={() => setManualOpen((open) => !open)}
        >
          {t("manual")}
          {manualOpen ? (
            <ChevronUp size={13} strokeWidth={1.5} aria-hidden />
          ) : (
            <ChevronDown size={13} strokeWidth={1.5} aria-hidden />
          )}
        </Button>
      </section>

      {manualOpen && plan ? <ManualPanel command={plan.command} showLink={!plan.manager} /> : null}
    </SetupShell>
  );
}
