import { LoaderCircle } from "lucide-react";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import type { DetectionState } from "../hooks/useSkillDetection";
import type { InstallPhase } from "../lib/phase";

const BASE = "font-mono uppercase tracking-label text-micro inline-flex items-center gap-1.5";
const DOT = "inline-block h-1 w-1 rounded-full shrink-0";

type Props = {
  phase: InstallPhase;
  detection: DetectionState;
};

export function DetectionChip({ phase, detection }: Props) {
  const t = useT("custom.url");

  if (phase === "empty") {
    return <span className={cn(BASE, "text-fg-4")}>{t("awaiting")}</span>;
  }

  if (phase === "invalid") {
    return (
      <span className={cn(BASE, "text-fg-4")}>
        <span className={cn(DOT, "bg-fg-4")} aria-hidden />
        {t("invalidFormat")}
      </span>
    );
  }

  if (phase === "checking" || phase === "installing") {
    return (
      <span className={cn(BASE, "text-fg-3")}>
        <LoaderCircle size={11} className="animate-spin" aria-hidden />
        {phase === "installing" ? t("installing") : t("checking")}
      </span>
    );
  }

  if (phase === "noSkills") {
    return (
      <span className={cn(BASE, "text-warning")}>
        <span className={cn(DOT, "bg-warning")} aria-hidden />
        {t("noSkillsFound")}
      </span>
    );
  }

  if (phase === "checkFailed") {
    return (
      <span
        className={cn(BASE, "text-warning")}
        title={detection.kind === "error" ? detection.message : undefined}
      >
        <span className={cn(DOT, "bg-warning")} aria-hidden />
        {t("checkFailed")}
      </span>
    );
  }

  if (detection.kind !== "ok") return null;
  const { skills, total, truncated } = detection.detection;

  return (
    <span className={cn(BASE, "text-success")}>
      <span className={cn(DOT, "bg-success")} aria-hidden />
      {skills.length === 1
        ? t("skillFound", { name: skills[0].name })
        : truncated
          ? t("skillsTruncated", { visible: skills.length, total })
          : t("skillsFound", { count: total })}
    </span>
  );
}
