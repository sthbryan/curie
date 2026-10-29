import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@zovaris/sephiro/button";
import { FileArchive, LoaderCircle } from "lucide-react";

import { useT } from "@/i18n";

import { usePathInstall } from "../hooks/usePathInstall";
import { FormSection } from "./FormSection";

export function LocalSkillForm() {
  const t = useT("custom.local");
  const { installing, installPath } = usePathInstall();

  const pickArchive = async () => {
    const selected = await open({
      directory: false,
      multiple: false,
      title: t("archiveTitle"),
      filters: [{ name: "Skill archive", extensions: ["zip", "skill"] }],
    }).catch(() => null);
    if (typeof selected === "string") await installPath(selected);
  };

  return (
    <FormSection eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
      <div className="flex flex-wrap items-center gap-3 border border-border bg-surface px-3 py-2">
        <p className="min-w-0 flex-1 font-body text-xs text-fg-4">{t("bundleHint")}</p>
        <Button
          size="sm"
          variant="primary"
          onClick={() => void pickArchive()}
          disabled={installing}
          aria-busy={installing}
        >
          {installing ? (
            <LoaderCircle size={12} className="animate-spin" aria-hidden />
          ) : (
            <FileArchive size={12} aria-hidden />
          )}
          {t("chooseArchive")}
        </Button>
      </div>
    </FormSection>
  );
}
