import { motion } from "motion/react";
import { Else, If, Then, When } from "react-if";
import { Button } from "../../../components/Button";
import { Label } from "../../../components/Label";
import type { Lang } from "../../../i18n";
import { t } from "../../../i18n";
import { fadeUp } from "../../../lib/motion";

type Props = {
  lang: Lang;
  skillsCount: number;
  updateCount: number;
  actionBusy: boolean;
  skillsLoading: boolean;
  updatesLoading: boolean;
  updatingAll: boolean;
  updateApplyError: string | null;
  removeError: string | null;
  onUpdateAll: () => void;
  onRefresh: () => void;
  onInstall: () => void;
  onDismissError: () => void;
};

export function InstalledHeader({
  lang,
  skillsCount,
  updateCount,
  actionBusy,
  skillsLoading,
  updatesLoading,
  updatingAll,
  updateApplyError,
  removeError,
  onUpdateAll,
  onRefresh,
  onInstall,
  onDismissError,
}: Props) {
  return (
    <motion.section {...fadeUp(0)} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Label lang={lang}>{t(lang, "installed.eyebrow")}</Label>
          <h2 className="font-display text-heading font-bold tracking-tight text-fg">
            {t(lang, "installed.title")}
          </h2>
          <p className="font-body text-sm text-fg-3 max-w-lg">
            {t(lang, "installed.subtitle", { n: skillsCount })}
            {updateCount > 0 ? ` · ${t(lang, "installed.updatesHint", { n: updateCount })}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-1">
          <When condition={updateCount > 0}>
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
          <Button size="xs" variant="link" className="shrink-0 px-0" onClick={onDismissError}>
            ×
          </Button>
        </div>
      </When>
    </motion.section>
  );
}
