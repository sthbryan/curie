import { motion } from "motion/react";
import { useMemo } from "react";
import { Else, If, Then, When } from "react-if";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import { t } from "@/i18n";
import { loadGlobalSkills } from "@/lib/boot";
import { fadeUp } from "@/lib/motion";
import { updateNameSet } from "@/lib/skills";
import { useSkillsStore } from "@/store/skills";
import { useSystemStore } from "@/store/system";
import { useInstalledActionsStore } from "../store";

export function InstalledHeader() {
  const lang = useSystemStore((s) => s.lang);
  const skills = useSkillsStore((s) => s.skills);
  const skillUpdates = useSkillsStore((s) => s.skillUpdates);
  const skillsLoading = useSkillsStore((s) => s.skillsLoading);
  const updatesLoading = useSkillsStore((s) => s.updatesLoading);
  const updatingSkill = useInstalledActionsStore((s) => s.updatingSkill);
  const removingSkill = useInstalledActionsStore((s) => s.removingSkill);
  const updateApplyError = useInstalledActionsStore((s) => s.updateApplyError);
  const removeError = useInstalledActionsStore((s) => s.removeError);
  const update = useInstalledActionsStore((s) => s.update);
  const dismissErrors = useInstalledActionsStore((s) => s.dismissErrors);

  const updateNames = useMemo(() => updateNameSet(skillUpdates), [skillUpdates]);
  const actionBusy = updatingSkill !== null || removingSkill !== null;
  const updatingAll = updatingSkill === "*";

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
          <Label lang={lang}>{t(lang, "installed.eyebrow")}</Label>
          <h2 className="font-display text-heading font-bold tracking-tight text-fg">
            {t(lang, "installed.title")}
          </h2>
          <p className="font-body text-sm text-fg-3 max-w-lg">
            {t(lang, "installed.subtitle", { n: skills.length })}
            {updateNames.size > 0
              ? ` · ${t(lang, "installed.updatesHint", { n: updateNames.size })}`
              : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-1">
          <When condition={updateNames.size > 0}>
            <Button
              size="md"
              variant="accent-outline"
              className="font-bold"
              onClick={onUpdateAll}
              disabled={actionBusy || updatesLoading}
            >
              <If condition={updatingAll}>
                <Then>{t(lang, "installed.updatingAll")}</Then>
                <Else>{t(lang, "installed.updateAll")}</Else>
              </If>
            </Button>
          </When>
          <Button
            size="md"
            variant="outline"
            onClick={onRefresh}
            disabled={skillsLoading || updatesLoading || actionBusy}
          >
            <If condition={skillsLoading || updatesLoading}>
              <Then>{t(lang, "installed.refreshing")}</Then>
              <Else>{t(lang, "installed.refresh")}</Else>
            </If>
          </Button>
          <Button size="md" variant="primary" onClick={onInstall}>
            {t(lang, "installed.install")}
          </Button>
        </div>
      </div>

      <When condition={Boolean(updateApplyError || removeError)}>
        <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
          <div className="min-w-0 flex flex-col gap-1">
            <span className="font-mono uppercase tracking-label text-micro text-accent">
              <If condition={Boolean(updateApplyError)}>
                <Then>{t(lang, "installed.updateError")}</Then>
                <Else>{t(lang, "installed.removeError")}</Else>
              </If>
            </span>
            <p className="font-body text-sm text-fg-3 break-all">
              {updateApplyError ?? removeError}
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
