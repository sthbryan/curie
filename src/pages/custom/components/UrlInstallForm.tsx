import { GitBranch, LoaderCircle } from "lucide-react";
import { useState } from "react";
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

export function UrlInstallForm({ actions }: Props) {
  const t = useT("custom.url");
  const [value, setValue] = useState("");
  const busy = actions.installStatus.value.status === "processing";

  const kind = classifyInput(value);
  const isReady = kind !== null;
  const trimmed = value.trim();
  const detection = useSkillDetection(isReady ? trimmed : null);

  const handleSubmit = () => {
    if (!isReady || busy) return;
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

  const buttonLabel = getButtonLabel(detection, t);

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
            wrapperClassName="w-full"
          />
        </div>
        <Button
          size="lg"
          variant="primary"
          className="px-5 shrink-0 sm:mt-5.5"
          onClick={handleSubmit}
          disabled={!isReady || busy}
        >
          <GitBranch size={14} />
          {buttonLabel}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <DetectionChip detection={detection} fallbackKind={kind} />
        <p className="font-body text-xs text-fg-4">{t("hint")}</p>
      </div>
    </div>
  );
}

function getButtonLabel(detection: DetectionState, t: ReturnType<typeof useT>): string {
  if (detection.kind === "ok" && detection.detection.skills.length > 1) {
    if (detection.detection.truncated) {
      return t("installWithCountTruncated", {
        visible: detection.detection.skills.length,
        total: detection.detection.total,
      });
    }
    return t("installWithCount", { count: detection.detection.total });
  }
  return t("submit");
}

function DetectionChip({
  detection,
  fallbackKind,
}: {
  detection: DetectionState;
  fallbackKind: "url" | "package" | null;
}) {
  const t = useT("custom.url");
  const base = "font-mono uppercase tracking-label text-micro inline-flex items-center gap-1.5";

  if (detection.kind === "idle") {
    return <span className={cn(base, "text-fg-4")}>—</span>;
  }

  if (detection.kind === "checking") {
    return (
      <span className={cn(base, "text-fg-3")}>
        <LoaderCircle size={11} className="animate-spin" aria-hidden />
        {t("checking")}
      </span>
    );
  }

  if (detection.kind === "ok") {
    const { skills, total, truncated } = detection.detection;
    if (skills.length === 1) {
      return (
        <span className={cn(base, "text-success")}>
          <span className="inline-block h-1 w-1 rounded-full bg-success" aria-hidden />
          {t("skillFound", { name: skills[0].name })}
        </span>
      );
    }
    return (
      <span className={cn(base, "text-success")}>
        <span className="inline-block h-1 w-1 rounded-full bg-success" aria-hidden />
        {truncated
          ? t("skillsTruncated", { visible: skills.length, total })
          : t("skillsFound", { count: total })}
      </span>
    );
  }

  if (detection.kind === "empty") {
    return (
      <span className={cn(base, "text-warning")}>
        <span className="inline-block h-1 w-1 rounded-full bg-warning" aria-hidden />
        {t("noSkillsFound")}
      </span>
    );
  }

  return (
    <span className={cn(base, fallbackKind ? "text-fg-3" : "text-fg-4")}>
      {fallbackKind ? (fallbackKind === "url" ? t("urlDetected") : t("packageDetected")) : "—"}
    </span>
  );
}
