import { motion } from "motion/react";
import type { SkillInfo } from "../../../components/types";
import type { Lang } from "../../../i18n";
import { t } from "../../../i18n";
import { listItem } from "../../../lib/motion";
import { formatRelative, skillTimestamp } from "../../../lib/skills";
import { AgentBadge } from "./AgentBadge";

type Props = {
  skill: SkillInfo;
  lang: Lang;
};

export function SkillRow({ skill, lang }: Props) {
  const when = skillTimestamp(skill);

  return (
    <motion.article
      layout
      variants={listItem}
      className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_5.5rem] items-start gap-4 border-b border-border py-4 first:border-t"
    >
      <div className="min-w-0 flex flex-col gap-1">
        <span className="font-mono text-mono text-fg truncate">{skill.name}</span>
        <span className="font-mono uppercase tracking-label text-micro text-fg-4 truncate">
          {skill.scope}
        </span>
      </div>

      <div className="min-w-0 flex flex-col gap-1">
        <span className="font-mono text-mono text-fg-2 truncate">
          {skill.source ?? t(lang, "installed.local")}
        </span>
        <span className="font-mono text-micro text-fg-4 truncate" title={skill.path}>
          {skill.path}
        </span>
      </div>

      <div className="min-w-0 flex flex-wrap gap-1.5">
        {skill.agents.length === 0 ? (
          <span className="font-mono uppercase tracking-label text-micro text-fg-4">
            {t(lang, "installed.noAgents")}
          </span>
        ) : (
          skill.agents.map((agent) => <AgentBadge key={`${skill.name}-${agent}`} label={agent} />)
        )}
      </div>

      <div className="text-right">
        <span className="font-mono uppercase tracking-label text-micro text-fg-4">
          {when ? formatRelative(when) : "—"}
        </span>
      </div>
    </motion.article>
  );
}
