import { GitBranch, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { When } from "react-if";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { useSkillDetection } from "../hooks/useSkillDetection";
import { useSkillInstall } from "../hooks/useSkillInstall";
import { isPending, resolvePhase } from "../lib/phase";
import { classifyTarget } from "../lib/target";
import { DetectionChip } from "./DetectionChip";
import { FieldLabel } from "./FieldLabel";
import { FormSection } from "./FormSection";
import { SkillPreview } from "./SkillPreview";

const INPUT_ID = "custom-url-input";
const STATUS_ID = "custom-url-status";

export function UrlInstallForm() {
  const t = useT("custom.url");
  const [value, setValue] = useState("");
  const { installing, install } = useSkillInstall();

  const trimmed = value.trim();
  const detection = useSkillDetection(classifyTarget(value) !== null ? trimmed : null);
  const phase = resolvePhase(value, installing, detection);
  const pending = isPending(phase);
  const canInstall = phase === "ready";
  const detected = detection.kind === "ok" && !installing ? detection.detection : null;

  const handleSubmit = () => {
    if (!canInstall) return;
    void install(trimmed).then((ok) => {
      if (ok && trimmed === value.trim()) setValue("");
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <FormSection eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <FieldLabel htmlFor={INPUT_ID}>{t("label")}</FieldLabel>
          <Input
            id={INPUT_ID}
            label={t("label")}
            type="text"
            value={value}
            onChange={(e) => setValue((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            disabled={installing}
            aria-describedby={STATUS_ID}
            aria-busy={pending}
            wrapperClassName="w-full"
            className={cn(
              "disabled:opacity-60",
              phase === "ready" && "border-success/60 focus:border-success",
              (phase === "noSkills" || phase === "checkFailed") &&
                "border-warning/60 focus:border-warning",
            )}
          />
        </div>
        <Button
          size="lg"
          variant="primary"
          className="px-5 shrink-0 sm:mt-5.5 min-w-40"
          onClick={handleSubmit}
          disabled={!canInstall}
          aria-busy={pending}
        >
          {pending ? (
            <LoaderCircle size={14} className="animate-spin" aria-hidden />
          ) : (
            <GitBranch size={14} aria-hidden />
          )}
          {installing ? t("installing") : t("submit")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span id={STATUS_ID} aria-live="polite" className="inline-flex">
          <DetectionChip phase={phase} detection={detection} />
        </span>
        <p className="font-body text-xs text-fg-4">{t("hint")}</p>
        <When condition={trimmed.length > 0 && !installing}>
          <button
            type="button"
            onClick={() => setValue("")}
            className="font-mono uppercase tracking-label text-micro text-fg-4 hover:text-fg transition-colors cursor-pointer"
          >
            {t("clear")}
          </button>
        </When>
      </div>

      {detected && <SkillPreview detection={detected} />}
    </FormSection>
  );
}
