import { CircleFadingArrowUp, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import { t as rawT, useT } from "@/i18n";
import { checkSkillUpdates, loadGlobalSkills } from "@/lib/boot";
import { cn } from "@/lib/cn";
import { skills, skillsLoading, updatesLoading } from "@/store/skills";
import { lang } from "@/store/system";
import { updateNames } from "../lib/derived";
import { removingSkill, update, updatingSkill } from "../store/store";

type Props = {
  onAskRemoveAll: () => void;
};

export function InstalledHeader({ onAskRemoveAll }: Props) {
  const t = useT("installed");
  const outdated = updateNames.value;
  const actionBusy = updatingSkill.value !== null || removingSkill.value !== null;
  const refreshing = skillsLoading.value || updatesLoading.value;
  const [, navigate] = useLocation();

  const refresh = async () => {
    await loadGlobalSkills({ checkUpdates: false });
    await checkSkillUpdates();
    const found = updateNames.value.size;
    toast.success(
      found > 0
        ? rawT(lang.value, "toast.updates", { n: found })
        : rawT(lang.value, "toast.noUpdates"),
    );
  };

  return (
    <section className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-3">
        <Label>{t("eyebrow")}</Label>
        <h2 className="font-display text-heading font-bold tracking-tight text-fg">{t("title")}</h2>
        <p className="max-w-lg font-body text-sm text-fg-3">
          {t("subtitle", { n: skills.value.length })}
          {outdated.size > 0 ? ` · ${t("updatesHint", { n: outdated.size })}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {outdated.size > 0 ? (
          <Button
            size="sm"
            variant="accent-outline"
            className="font-bold"
            onClick={() => {
              update([...outdated]).catch(() => {});
            }}
            disabled={actionBusy || updatesLoading.value}
          >
            <CircleFadingArrowUp size={14} />
            {updatingSkill.value === "*" ? t("updatingAll") : t("updateAll")}
          </Button>
        ) : null}

        <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing || actionBusy}>
          <RefreshCcw size={14} className={cn(refreshing && "animate-spin")} />
          {refreshing ? t("refreshing") : t("refresh")}
        </Button>

        <Button size="sm" variant="primary" onClick={() => navigate("/find")}>
          <Plus size={14} />
          {t("install")}
        </Button>

        {skills.value.length > 0 ? (
          <>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            <Button size="sm" variant="danger" onClick={onAskRemoveAll} disabled={actionBusy}>
              <Trash2 size={14} />
              {t("removeAllButton")}
            </Button>
          </>
        ) : null}
      </div>
    </section>
  );
}
