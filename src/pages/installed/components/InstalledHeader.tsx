import { CircleFadingArrowUp, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { Heading } from "@/components/Heading";
import { Label } from "@/components/Label";
import { t as rawT, useT } from "@/i18n";
import { checkSkillUpdates, loadSkills } from "@/lib/boot";
import { cn } from "@/lib/cn";
import { useRoute } from "@/lib/routes";
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
  const { scope, go } = useRoute();
  const projectPath = scope.kind === "project" ? scope.project.path : null;

  const refresh = async () => {
    await loadSkills(projectPath, { checkUpdates: false });
    await checkSkillUpdates(projectPath);
    const found = updateNames.value.size;
    toast.success(
      found > 0
        ? rawT(lang.value, "toast.updates", { n: found })
        : rawT(lang.value, "toast.noUpdates"),
    );
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Label>{t("eyebrow")}</Label>
        <Heading>{t("title")}</Heading>
        <p className="max-w-lg font-body text-sm text-fg-3">
          {t("subtitle", { n: skills.value.length })}
          {scope.kind === "project" ? ` ${t("scopeBadge", { name: scope.project.name })}` : ""}
          {outdated.size > 0 ? ` · ${t("updatesHint", { n: outdated.size })}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={scope.kind === "project" ? "accent" : "primary"}
          onClick={() => go("find")}
        >
          <Plus size={14} />
          {t("install")}
        </Button>

        <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing || actionBusy}>
          <RefreshCcw size={14} className={cn(refreshing && "animate-spin")} />
          {refreshing ? t("refreshing") : t("refresh")}
        </Button>

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

        {skills.value.length > 0 ? (
          <Button
            size="sm"
            variant="danger"
            className="ml-auto"
            onClick={onAskRemoveAll}
            disabled={actionBusy}
          >
            <Trash2 size={14} />
            {t("removeAllButton")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
