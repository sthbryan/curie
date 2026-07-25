import { When } from "react-if";
import type { SkillDetection } from "@/components/types";
import { useT } from "@/i18n";

const PREVIEW_LIMIT = 6;

type Props = {
  detection: SkillDetection;
};

export function SkillPreview({ detection }: Props) {
  const t = useT("custom.url");
  const { skills, total } = detection;
  if (skills.length < 2) return null;

  const shown = skills.slice(0, PREVIEW_LIMIT);
  const hidden = Math.max(total, skills.length) - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((skill) => (
        <span
          key={skill.name}
          title={skill.description}
          className="border border-border px-2 py-0.5 font-mono text-micro text-fg-3"
        >
          {skill.name}
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
