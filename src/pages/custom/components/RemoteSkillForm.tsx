import { Field } from "@zovaris/sephiro/field";
import { Input } from "@zovaris/sephiro/input";
import { GitBranch, LoaderCircle, X } from "lucide-react";
import { useState } from "react";

import "@zovaris/sephiro/css/field.css";
import "@zovaris/sephiro/css/input.css";

import { Button } from "@/components/Button";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";

import { useRemoteInstall } from "../hooks/useRemoteInstall";
import { useSkillDetection } from "../hooks/useSkillDetection";
import { isPending, resolvePhase } from "../lib/phase";
import { classifyTarget } from "../lib/target";
import { DetectionChip } from "./DetectionChip";
import { FormSection } from "./FormSection";
import { SkillPreview } from "./SkillPreview";

const INPUT_ID = "custom-remote-input";
const STATUS_ID = "custom-remote-status";

export function RemoteSkillForm() {
  const t = useT("custom.remote");
  const [value, setValue] = useState("");
  const { installing, install } = useRemoteInstall();

  const trimmed = value.trim();
  const detection = useSkillDetection(classifyTarget(value) !== null ? trimmed : null);
  const phase = resolvePhase(value, installing, detection);
  const pending = isPending(phase);
  const canInstall = phase === "ready";
  const detected = detection.kind === "ok" ? detection.detection : null;

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
        <div className="relative flex flex-col gap-1.5 flex-1 min-w-0">
          <Field label={t("label")} htmlFor={INPUT_ID}>
            <Input
              id={INPUT_ID}
              size="lg"
              type="text"
              value={value}
              onChange={(e) => setValue((e.target as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              disabled={installing}
              invalid={phase === "noSkills" || phase === "checkFailed"}
              aria-describedby={STATUS_ID}
              aria-busy={pending}
              className={cn("pr-9", phase === "ready" && "border-success")}
            />
          </Field>
          {trimmed.length > 0 && !installing ? (
            <button
              type="button"
              onClick={() => setValue("")}
              aria-label={t("clear")}
              className="absolute right-2 bottom-2 inline-flex h-6 w-6 items-center justify-center text-fg-4 hover:text-fg transition-colors cursor-pointer"
            >
              <X size={14} aria-hidden />
            </button>
          ) : null}
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
      </div>

      {detected ? <SkillPreview detection={detected} /> : null}
    </FormSection>
  );
}
