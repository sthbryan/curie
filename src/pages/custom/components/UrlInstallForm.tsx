import { GitBranch, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { When } from "react-if";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { type CustomActions, classifyInput } from "../hooks/useCustomActions";
import { type DetectionState, useSkillDetection } from "../hooks/useSkillDetection";

type Props = {
  actions: CustomActions;
};

type Phase = "empty" | "invalid" | "checking" | "ready" | "none" | "failed" | "installing";

const PREVIEW_LIMIT = 6;

function resolvePhase(busy: boolean, hasInput: boolean, valid: boolean, d: DetectionState): Phase {
  if (busy) return "installing";
  if (!hasInput) return "empty";
  if (!valid) return "invalid";
  if (d.kind === "ok") return "ready";
  if (d.kind === "empty") return "none";
  if (d.kind === "error") return "failed";
  return "checking";
}

export function UrlInstallForm({ actions }: Props) {
  const t = useT("custom.url");
  const [value, setValue] = useState("");
  const busy = actions.installStatus.value.status === "processing";

  const trimmed = value.trim();
  const kind = classifyInput(value);
  const detection = useSkillDetection(kind !== null ? trimmed : null);
  const phase = resolvePhase(busy, trimmed.length > 0, kind !== null, detection);

  const canSubmit = phase === "ready";

  const handleSubmit = () => {
    if (!canSubmit) return;
    void actions.install(trimmed, null).then((result) => {
      if (result && trimmed === value.trim()) setValue("");
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const pending = phase === "checking" || phase === "installing";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>{t("eyebrow")}</Label>
        <h3 className="font-display text-xl font-bold tracking-tight text-fg">{t("title")}</h3>
        <p className="font-body text-sm text-fg-3 max-w-lg">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <label
            htmlFor="custom-url-input"
            className="font-mono uppercase tracking-label text-micro text-fg-3"
          >
            {t("label")}
          </label>
          <Input
            id="custom-url-input"
            label={t("label")}
            type="text"
            value={value}
            onChange={(e) => setValue((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            disabled={busy}
            aria-describedby="custom-url-status"
            aria-busy={pending}
            wrapperClassName="w-full"
            className={cn(
              "disabled:opacity-60",
              phase === "ready" && "border-success/60 focus:border-success",
              (phase === "none" || phase === "failed") && "border-warning/60 focus:border-warning",
            )}
          />
        </div>
        <Button
          size="lg"
          variant="primary"
          className="px-5 shrink-0 sm:mt-5.5 min-w-40"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-busy={pending}
        >
          {pending ? (
            <LoaderCircle size={14} className="animate-spin" aria-hidden />
          ) : (
            <GitBranch size={14} aria-hidden />
          )}
          {phase === "installing" ? t("installing") : t("submit")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span id="custom-url-status" aria-live="polite" className="inline-flex">
          <StatusChip phase={phase} detection={detection} />
        </span>
        <p className="font-body text-xs text-fg-4">{t("hint")}</p>
        <When condition={trimmed.length > 0 && !busy}>
          <button
            type="button"
            onClick={() => setValue("")}
            className="font-mono uppercase tracking-label text-micro text-fg-4 hover:text-fg transition-colors cursor-pointer"
          >
            {t("clear")}
          </button>
        </When>
      </div>

      <When condition={phase === "ready" && detection.kind === "ok"}>
        <SkillPreview detection={detection} />
      </When>
    </div>
  );
}

function StatusChip({ phase, detection }: { phase: Phase; detection: DetectionState }) {
  const t = useT("custom.url");
  const base = "font-mono uppercase tracking-label text-micro inline-flex items-center gap-1.5";
  const dot = "inline-block h-1 w-1 rounded-full shrink-0";

  if (phase === "empty") {
    return <span className={cn(base, "text-fg-4")}>{t("awaiting")}</span>;
  }

  if (phase === "invalid") {
    return (
      <span className={cn(base, "text-fg-4")}>
        <span className={cn(dot, "bg-fg-4")} aria-hidden />
        {t("invalidFormat")}
      </span>
    );
  }

  if (phase === "checking" || phase === "installing") {
    return (
      <span className={cn(base, "text-fg-3")}>
        <LoaderCircle size={11} className="animate-spin" aria-hidden />
        {phase === "installing" ? t("installing") : t("checking")}
      </span>
    );
  }

  if (phase === "none") {
    return (
      <span className={cn(base, "text-warning")}>
        <span className={cn(dot, "bg-warning")} aria-hidden />
        {t("noSkillsFound")}
      </span>
    );
  }

  if (phase === "failed") {
    return (
      <span
        className={cn(base, "text-warning normal-case tracking-normal")}
        title={detection.kind === "error" ? detection.message : undefined}
      >
        <span className={cn(dot, "bg-warning")} aria-hidden />
        <span className="uppercase tracking-label">{t("checkFailed")}</span>
      </span>
    );
  }

  if (detection.kind !== "ok") return null;
  const { skills, total, truncated } = detection.detection;
  return (
    <span className={cn(base, "text-success")}>
      <span className={cn(dot, "bg-success")} aria-hidden />
      {skills.length === 1
        ? t("skillFound", { name: skills[0].name })
        : truncated
          ? t("skillsTruncated", { visible: skills.length, total })
          : t("skillsFound", { count: total })}
    </span>
  );
}

function SkillPreview({ detection }: { detection: DetectionState }) {
  const t = useT("custom.url");
  if (detection.kind !== "ok") return null;
  const { skills, total } = detection.detection;
  if (skills.length < 2) return null;

  const shown = skills.slice(0, PREVIEW_LIMIT);
  const hidden = Math.max(total, skills.length) - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((s) => (
        <span
          key={s.name}
          title={s.description}
          className="border border-border px-2 py-0.5 font-mono text-micro text-fg-3"
        >
          {s.name}
        </span>
      ))}
      <When condition={hidden > 0}>
        <span className="font-mono uppercase tracking-label text-micro text-fg-4">
          {t("moreSkills", { count: hidden })}
        </span>
      </When>
    </div>
  );
}
