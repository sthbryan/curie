import { GitBranch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Else, If, Then, When } from "react-if";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import type { DetectedSkill } from "@/components/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { type CustomActions, classifyInput } from "../hooks/useCustomActions";
import { useSkillDetection } from "../hooks/useSkillDetection";

type Props = {
  actions: CustomActions;
};

const MAX_VISIBLE = 50;

export function UrlInstallForm({ actions }: Props) {
  const t = useT("custom.url");
  const [url, setUrl] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const kind = classifyInput(url);
  const isReady = kind !== null;
  const busy = actions.installStatus.value.status === "processing";
  const trimmed = url.trim();

  const detection = useSkillDetection(isReady ? trimmed : null);

  const detectionKey = isReady ? trimmed : null;
  useEffect(() => {
    setSelectedSkill(null);
    setFilter("");
  }, [detectionKey]);

  useEffect(() => {
    if (detection.kind !== "ok") return;
    const first = detection.detection.skills[0]?.name;
    if (first && selectedSkill === null) {
      setSelectedSkill(first);
    }
  }, [detection, selectedSkill]);

  const visibleSkills = useMemo<DetectedSkill[]>(() => {
    if (detection.kind !== "ok") return [];
    if (!filter.trim()) return detection.detection.skills;
    const q = filter.toLowerCase();
    return detection.detection.skills.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
    );
  }, [detection, filter]);

  const pickerState =
    detection.kind === "ok" && detection.detection.skills.length > 1 ? detection.detection : null;

  const handleSubmit = () => {
    if (!isReady || busy) return;
    const submitted = trimmed;
    void actions.install(submitted, selectedSkill).then((result) => {
      if (!result) return;
      if (trimmed === submitted) {
        setUrl("");
        setSelectedSkill(null);
        setFilter("");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

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
            value={url}
            onChange={(e) => setUrl(e.target.value)}
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
          <If condition={busy}>
            <Then>{t("installing")}</Then>
            <Else>{t("submit")}</Else>
          </If>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <DetectionChip detection={detection} fallbackKind={kind} />
          <p className="font-body text-xs text-fg-4">{t("hint")}</p>
        </div>

        <If condition={pickerState !== null}>
          <Then>
            {pickerState ? (
              <SkillPicker
                skills={visibleSkills}
                total={pickerState.total}
                truncated={pickerState.truncated}
                selected={selectedSkill}
                onSelect={setSelectedSkill}
                filter={filter}
                onFilterChange={setFilter}
                maxVisible={MAX_VISIBLE}
              />
            ) : null}
          </Then>
        </If>
      </div>
    </div>
  );
}

function DetectionChip({
  detection,
  fallbackKind,
}: {
  detection: ReturnType<typeof useSkillDetection>;
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
        <span className="inline-block h-1 w-1 rounded-full bg-fg-3 animate-pulse" aria-hidden />
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

function SkillPicker({
  skills,
  total,
  truncated,
  selected,
  onSelect,
  filter,
  onFilterChange,
  maxVisible,
}: {
  skills: DetectedSkill[];
  total: number;
  truncated: boolean;
  selected: string | null;
  onSelect: (name: string) => void;
  filter: string;
  onFilterChange: (v: string) => void;
  maxVisible: number;
}) {
  const t = useT("custom.url");
  const showFilter = truncated || total > maxVisible;
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-border bg-surface/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono uppercase tracking-label text-micro text-fg-3">
          {t("selectSkill")}
        </span>
        <When condition={showFilter}>
          <input
            type="text"
            value={filter}
            onChange={(e) => onFilterChange((e.target as HTMLInputElement).value)}
            placeholder={t("filterPlaceholder")}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="h-7 max-w-[180px] flex-1 border border-border-strong bg-bg px-2 font-mono text-micro text-fg placeholder:text-fg-4 focus:border-fg-3 focus:outline-none"
          />
        </When>
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
        <If condition={skills.length === 0}>
          <Then>
            <span className="font-mono text-micro text-fg-4">{t("noMatches")}</span>
          </Then>
          <Else>
            {skills.map((s) => {
              const isSelected = s.name === selected;
              return (
                <Button
                  key={s.name}
                  type="button"
                  size="xs"
                  variant="outline"
                  selected={isSelected}
                  onClick={() => onSelect(s.name)}
                  title={s.description}
                  className="max-w-[200px] truncate"
                >
                  {s.name}
                </Button>
              );
            })}
          </Else>
        </If>
      </div>
      <When condition={truncated}>
        <p className="font-body text-xs text-fg-4">
          {t("truncatedHint", { visible: skills.length, total })}
        </p>
      </When>
    </div>
  );
}
