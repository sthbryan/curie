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
  updateAvailable?: boolean;
  updating?: boolean;
  updateBusy?: boolean;
  onUpdate?: (name: string) => void;
};

export function SkillRow({
  skill,
  lang,
  updateAvailable = false,
  updating = false,
  updateBusy = false,
  onUpdate,
}: Props) {
  const when = skillTimestamp(skill);

  return (
    <motion.article
      layout
      variants={listItem}
      className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_5rem_5.5rem] items-start gap-4 border-b border-border py-4 first:border-t"
    >
      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-mono text-fg truncate">{skill.name}</span>
          {updateAvailable && (
            <span className="shrink-0 font-mono uppercase tracking-label text-micro text-accent border border-accent/40 px-1.5 py-0.5 rounded-sm">
              {t(lang, "installed.badgeUpdate")}
            </span>
          )}
        </div>
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
        <span
          className={`font-mono uppercase tracking-label text-micro ${
            updateAvailable ? "text-accent" : "text-fg-4"
          }`}
        >
          {updateAvailable ? t(lang, "installed.badgeUpdate") : when ? formatRelative(when) : "—"}
        </span>
      </div>

      <div className="flex justify-end">
        {updateAvailable ? (
          <button
            type="button"
            onClick={() => onUpdate?.(skill.name)}
            disabled={updateBusy}
            className="h-7 px-2.5 border border-accent/50 text-accent rounded-sm font-mono uppercase tracking-label text-micro hover:bg-accent hover:text-accent-fg disabled:opacity-50 transition-colors duration-150"
          >
            {updating ? t(lang, "installed.updatingOne") : t(lang, "installed.updateOne")}
          </button>
        ) : (
          <span className="font-mono uppercase tracking-label text-micro text-fg-4">—</span>
        )}
      </div>
    </motion.article>
  );
}
