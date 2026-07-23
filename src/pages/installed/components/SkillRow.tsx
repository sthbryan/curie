import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Else, If, Then, When } from "react-if";
import { ActionProgress } from "@/components/ActionProgress";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconButton } from "@/components/IconButton";
import type { SkillInfo } from "@/components/types";
import type { Lang } from "@/i18n";
import { t } from "@/i18n";
import { listItem } from "@/lib/motion";
import { formatRelative, skillTimestamp } from "@/lib/skills";
import { AgentBadge } from "./AgentBadge";

export const INSTALLED_GRID =
  "grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_4.5rem_5rem]";

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
  const wasRemoving = useRef(false);
  const busy = updating || removing;

  useEffect(() => {
    if (removing) {
      wasRemoving.current = true;
      return;
    }
    if (wasRemoving.current) {
      wasRemoving.current = false;
      setConfirmRemove(false);
    }
  }, [removing]);

  return (
    <>
      <motion.article
        layout
        variants={listItem}
        className={`grid ${INSTALLED_GRID} items-center gap-4 border-b border-border py-4 first:border-t`}
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

        <div className="flex h-7 items-center justify-end gap-1">
          <If condition={busy}>
            <Then>
              <ActionProgress
                active
                lang={lang}
                labelKey={updating ? "installed.updatingOne" : "installed.removing"}
              />
            </Then>
            <Else>
              <When condition={updateAvailable}>
                <IconButton
                  variant="accent"
                  label={t(lang, "installed.updateOne")}
                  onClick={() => onUpdate?.(skill.name)}
                  disabled={actionBusy}
                >
                  ↑
                </IconButton>
              </When>
              <When condition={!updateAvailable}>
                <span className="inline-block h-7 w-7 shrink-0" aria-hidden />
              </When>
              <IconButton
                variant="danger"
                label={t(lang, "installed.remove")}
                onClick={() => setConfirmRemove(true)}
                disabled={actionBusy}
              >
                ×
              </IconButton>
            </Else>
          </If>
        </div>
      </motion.article>

      <ConfirmDialog
        open={confirmRemove}
        title={t(lang, "installed.removeTitle")}
        description={t(lang, "installed.removeBody")}
        detail={skill.name}
        confirmLabel={t(lang, "installed.removeConfirm")}
        cancelLabel={t(lang, "installed.removeCancel")}
        busy={removing}
        busyLabel={t(lang, "installed.removing")}
        onCancel={() => {
          if (!removing) setConfirmRemove(false);
        }}
        onConfirm={() => {
          onRemove?.(skill.name);
        }}
      />
    </>
  );
}
