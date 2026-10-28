import { Stepper } from "@zovaris/sephiro/stepper";

import type { SetupStep } from "@/components/types";
import { useT } from "@/i18n";

import "@zovaris/sephiro/css/stepper.css";

type Props = {
  steps: SetupStep[];
  current: SetupStep;
  manager: string;
};

export function StepList({ steps, current, manager }: Props) {
  const t = useT("setup");
  const currentIndex = steps.indexOf(current);

  return (
    <Stepper
      ariaLabel={t("progressTitle")}
      orientation="vertical"
      current={currentIndex === -1 ? steps.length : currentIndex}
      steps={steps.map((step) => ({
        id: step,
        label: t(`steps.${step}`, { manager }),
      }))}
    />
  );
}
