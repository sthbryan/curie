import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
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
        <div>
          <Button size="lg" variant="primary" onClick={() => void complete()}>
            {t("continue")}
            <ArrowRight size={12} strokeWidth={1.5} aria-hidden />
          </Button>
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
          title={t("errorOutput")}
          message={error}
          retryLabel={t("retry")}
          onRetry={() => void retry()}
        />
        {plan ? <ManualPanel command={plan.command} showLink={!plan.manager} /> : null}
      </SetupShell>
    );
  }

  return (
    <SetupShell eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
      {plan ? <PlanCard plan={plan} /> : null}

      <section className="flex items-center gap-3">
        <Button size="lg" variant="primary" onClick={() => void start()}>
          {t("cta")}
          <ArrowRight size={12} strokeWidth={1.5} aria-hidden />
        </Button>
        <Button
          size="lg"
          variant="ghost"
          aria-expanded={manualOpen}
          onClick={() => setManualOpen((open) => !open)}
        >
          {t("manual")}
          {manualOpen ? (
            <ChevronUp size={12} strokeWidth={1.5} aria-hidden />
          ) : (
            <ChevronDown size={12} strokeWidth={1.5} aria-hidden />
          )}
        </Button>
      </section>

      {manualOpen && plan ? <ManualPanel command={plan.command} showLink={!plan.manager} /> : null}
    </SetupShell>
  );
}
