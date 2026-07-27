import { Hexagon, PackageCheck, PackagePlus } from "lucide-react";
import { Label } from "@/components/Label";
import type { SetupPlan } from "@/components/types";
import { useT } from "@/i18n";
import { FALLBACK_MANAGER, managerLabel } from "../lib/managers";
import { PlanRow } from "./PlanRow";

type Props = {
  plan: SetupPlan;
};

export function PlanCard({ plan }: Props) {
  const t = useT("setup");
  const found = plan.manager;

  return (
    <section className="flex flex-col gap-5">
      <Label>{t("planLabel")}</Label>
      <div className="flex flex-col">
        <PlanRow
          icon={Hexagon}
          title={t("nodeName")}
          hint={t("nodeMissing")}
          chip={t("required")}
        />
        {found ? (
          <PlanRow
            icon={PackageCheck}
            title={t("managerTitle", { manager: managerLabel(found.id) })}
            hint={t("managerHint")}
            path={found.path}
            chip={t("reused")}
          />
        ) : (
          <PlanRow
            icon={PackagePlus}
            title={t("managerNoneTitle")}
            hint={t("managerNoneHint")}
            chip={t("added", { manager: FALLBACK_MANAGER })}
            chipClassName="text-accent"
          />
        )}
      </div>
    </section>
  );
}
