import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Else, If, Then, When } from "react-if";
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
  removing?: boolean;
  actionBusy?: boolean;
  onUpdate?: (name: string) => void;
  onRemove?: (name: string) => void;
};

export function SkillRow({
  skill,
  lang,
  updateAvailable = false,
  updating = false,
  removing = false,
  actionBusy = false,
  onUpdate,
  onRemove,
}: Props) {
  const when = skillTimestamp(skill);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (!confirmRemove) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmRemove(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmRemove]);

  useEffect(() => {
    if (removing) setConfirmRemove(false);
  }, [removing]);

  return (
    <motion.article
      layout
      variants={listItem}
      className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_5rem_minmax(7.5rem,auto)] items-start gap-4 border-b border-border py-4 first:border-t"
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
        <If condition={skill.agents.length === 0}>
          <Then>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang, "installed.noAgents")}
            </span>
          </Then>
          <Else>
            {skill.agents.map((agent) => (
              <AgentBadge key={`${skill.name}-${agent}`} label={agent} />
            ))}
          </Else>
        </If>
      </div>

      <div className="text-right">
        <span
          className={`font-mono uppercase tracking-label text-micro ${
            updateAvailable ? "text-accent" : "text-fg-4"
          }`}
        >
          {when ? formatRelative(when) : "—"}
        </span>
      </div>

      <div className="flex flex-wrap justify-end gap-1.5">
        <If condition={confirmRemove}>
          <Then>
            <button
              type="button"
              onClick={() => {
                setConfirmRemove(false);
                onRemove?.(skill.name);
              }}
              disabled={actionBusy}
              className="h-7 px-2.5 bg-accent text-accent-fg rounded-sm font-mono uppercase tracking-label text-micro font-bold hover:opacity-90 disabled:opacity-50 transition-opacity duration-150"
            >
              <If condition={removing}>
                <Then>{t(lang, "installed.removing")}</Then>
                <Else>{t(lang, "installed.removeConfirm")}</Else>
              </If>
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              disabled={removing}
              className="h-7 px-2.5 border border-border-strong text-fg-3 rounded-sm font-mono uppercase tracking-label text-micro hover:border-fg-3 hover:text-fg disabled:opacity-50 transition-colors duration-150"
            >
              {t(lang, "installed.removeCancel")}
            </button>
          </Then>
          <Else>
            <When condition={updateAvailable}>
              <button
                type="button"
                onClick={() => onUpdate?.(skill.name)}
                disabled={actionBusy}
                className="h-7 px-2.5 border border-accent/50 text-accent rounded-sm font-mono uppercase tracking-label text-micro hover:bg-accent hover:text-accent-fg disabled:opacity-50 transition-colors duration-150"
              >
                <If condition={updating}>
                  <Then>{t(lang, "installed.updatingOne")}</Then>
                  <Else>{t(lang, "installed.updateOne")}</Else>
                </If>
              </button>
            </When>
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              disabled={actionBusy}
              className="h-7 px-2.5 border border-border-strong text-fg-3 rounded-sm font-mono uppercase tracking-label text-micro hover:border-accent/50 hover:text-accent disabled:opacity-50 transition-colors duration-150"
            >
              <If condition={removing}>
                <Then>{t(lang, "installed.removing")}</Then>
                <Else>{t(lang, "installed.remove")}</Else>
              </If>
            </button>
          </Else>
        </If>
      </div>
    </motion.article>
  );
}
