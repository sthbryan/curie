import { CircleFadingArrowUp, Plus, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Else, If, Then, When } from "react-if";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import { t } from "@/i18n";
import { loadGlobalSkills } from "@/lib/boot";
import { cn } from "@/lib/cn";
import { fadeUp } from "@/lib/motion";
import { updateNameSet } from "@/lib/skills";
import { skills, skillsLoading, skillUpdates, updatesLoading } from "@/store/skills";
import { lang } from "@/store/system";
import {
  dismissErrors,
  removeError,
  removingSkill,
  update,
  updateApplyError,
  updatingSkill,
} from "../store/store";

export function InstalledHeader() {
  const updateNames = useMemo(() => updateNameSet(skillUpdates.value), [skillUpdates.value]);
  const actionBusy = updatingSkill.value !== null || removingSkill.value !== null;
  const updatingAll = updatingSkill.value === "*";

  const [, navigate] = useLocation();
  const onInstall = () => navigate("/find");
  const onRefresh = () => {
    void loadGlobalSkills();
  };
  const onUpdateAll = () => {
    const names = updateNames.size > 0 ? [...updateNames] : undefined;
    update(names).catch(() => {
      // store keeps updateApplyError
    });
  };

  return (
    <motion.section {...fadeUp(0)} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Label>{t(lang.value, "installed.eyebrow")}</Label>
          <h2 className="font-display text-heading font-bold tracking-tight text-fg">
            {t(lang.value, "installed.title")}
          </h2>
          <p className="font-body text-sm text-fg-3 max-w-lg">
            {t(lang.value, "installed.subtitle", { n: skills.value.length })}
            {updateNames.size > 0
              ? ` · ${t(lang.value, "installed.updatesHint", { n: updateNames.size })}`
              : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <When condition={updateNames.size > 0}>
            <Button
              size="sm"
              variant="accent-outline"
              className="font-bold"
              onClick={onUpdateAll}
              disabled={actionBusy || updatesLoading.value}
            >
              <CircleFadingArrowUp size={14} />
              <If condition={updatingAll}>
                <Then>{t(lang.value, "installed.updatingAll")}</Then>
                <Else>{t(lang.value, "installed.updateAll")}</Else>
              </If>
            </Button>
          </When>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={skillsLoading.value || updatesLoading.value || actionBusy}
          >
            <RefreshCcw
              size={14}
              className={cn({ "animate-spin": skillsLoading.value || updatesLoading.value })}
            />
            <If condition={skillsLoading.value || updatesLoading.value}>
              <Then>{t(lang.value, "installed.refreshing")}</Then>
              <Else>{t(lang.value, "installed.refresh")}</Else>
            </If>
          </Button>
          <Button size="sm" variant="primary" onClick={onInstall}>
            <Plus size={14} />
            {t(lang.value, "installed.install")}
          </Button>
        </div>
      </div>

      <When condition={Boolean(updateApplyError.value || removeError.value)}>
        <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
          <div className="min-w-0 flex flex-col gap-1">
            <span className="font-mono uppercase tracking-label text-micro text-accent">
              <If condition={Boolean(updateApplyError.value)}>
                <Then>{t(lang.value, "installed.updateError")}</Then>
                <Else>{t(lang.value, "installed.removeError")}</Else>
              </If>
            </span>
            <p className="font-body text-sm text-fg-3 break-all">
              {updateApplyError.value ?? removeError.value}
            </p>
          </div>
          <Button size="xs" variant="link" className="shrink-0 px-0" onClick={dismissErrors}>
            ×
          </Button>
        </div>
      </When>
    </motion.section>
  );
}
