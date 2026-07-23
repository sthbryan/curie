import { AnimatePresence, motion } from "motion/react";
import { Case, Default, Switch } from "react-if";
import { Button } from "@/components/Button";
import type { SkillInfo } from "@/components/types";
import type { Lang } from "@/i18n";
import { t } from "@/i18n";
import { fadeUp, listStagger } from "@/lib/motion";
import { SkillRow } from "./SkillRow";

type Props = {
  lang: Lang;
  skillsCount: number;
  filtered: SkillInfo[];
  updateNames: Set<string>;
  updatingSkill: string | null;
  removingSkill: string | null;
  actionBusy: boolean;
  /** Key that triggers list re-mount when filters change. */
  listKey: string;
  onInstall: () => void;
  onUpdate: (name: string) => void;
  onRemove: (name: string) => void;
};

export function InstalledList({
  lang,
  skillsCount,
  filtered,
  updateNames,
  updatingSkill,
  removingSkill,
  actionBusy,
  listKey,
  onInstall,
  onUpdate,
  onRemove,
}: Props) {
  return (
    <section className="flex flex-col">
      <Switch>
        <Case condition={skillsCount === 0}>
          <motion.div
            {...fadeUp(0.08)}
            className="flex flex-col gap-4 border border-border-strong bg-surface-tint px-5 py-8"
          >
            <span className="font-body text-sm text-fg">{t(lang, "installed.empty")}</span>
            <p className="font-body text-sm text-fg-3">{t(lang, "installed.emptyHint")}</p>
            <div>
              <Button size="lg" variant="primary" onClick={onInstall}>
                {t(lang, "installed.install")}
              </Button>
            </div>
          </motion.div>
        </Case>
        <Case condition={filtered.length === 0}>
          <motion.div {...fadeUp(0.08)} className="border-t border-border py-8">
            <p className="font-body text-sm text-fg-3">{t(lang, "installed.noMatches")}</p>
          </motion.div>
        </Case>
        <Default>
          <motion.div
            {...fadeUp(0.06)}
            className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_5rem_minmax(7.5rem,auto)] gap-4 border-b border-border pb-2"
          >
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang, "installed.colName")}
            </span>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang, "installed.colSource")}
            </span>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang, "installed.colAgents")}
            </span>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
              {t(lang, "installed.colWhen")}
            </span>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
              {t(lang, "installed.colActions")}
            </span>
          </motion.div>
          <motion.div
            key={listKey}
            className="flex flex-col"
            variants={listStagger}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((skill) => (
                <SkillRow
                  key={`${skill.name}-${skill.path}`}
                  skill={skill}
                  lang={lang}
                  updateAvailable={updateNames.has(skill.name)}
                  updating={updatingSkill === skill.name || updatingSkill === "*"}
                  removing={removingSkill === skill.name || removingSkill === "*"}
                  actionBusy={actionBusy}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </Default>
      </Switch>
    </section>
  );
}
