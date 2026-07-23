import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { Case, Default, Switch } from "react-if";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { t } from "@/i18n";
import { cn } from "@/lib/cn";
import { fadeUp, listStagger } from "@/lib/motion";
import { filterSkills, updateNameSet } from "@/lib/skills";
import { skills, skillUpdates } from "@/store/skills";
import { lang } from "@/store/system";
import { useInstalledActionsStore, useInstalledFiltersStore } from "../store";
import { INSTALLED_GRID, SkillRow } from "./SkillRow";

export function InstalledList() {
  const query = useInstalledFiltersStore((s) => s.query);
  const agentFilter = useInstalledFiltersStore((s) => s.agentFilter);
  const updatesOnly = useInstalledFiltersStore((s) => s.updatesOnly);

  const updatingSkill = useInstalledActionsStore((s) => s.updatingSkill);
  const removingSkill = useInstalledActionsStore((s) => s.removingSkill);
  const update = useInstalledActionsStore((s) => s.update);
  const remove = useInstalledActionsStore((s) => s.remove);

  const updateNames = useMemo(() => updateNameSet(skillUpdates.value), [skillUpdates.value]);
  const filtered = useMemo(
    () =>
      filterSkills(skills.value, query, agentFilter, {
        updatesOnly,
        updateNames,
      }),
    [skills.value, query, agentFilter, updatesOnly, updateNames],
  );
  const actionBusy = updatingSkill !== null || removingSkill !== null;

  const [, navigate] = useLocation();
  const onInstall = () => navigate("/find");
  const onUpdate = (name: string) => {
    update([name]).catch(() => {
      // store keeps updateApplyError
    });
  };
  const onRemove = (name: string) => {
    remove([name]).catch(() => {
      // store keeps removeError
    });
  };

  const listKey = `${agentFilter ?? "all"}:${query}:${updatesOnly ? "up" : "all"}`;

  return (
    <section className="flex flex-col">
      <Switch>
        <Case condition={skills.value.length === 0}>
          <motion.div
            {...fadeUp(0.08)}
            className="flex flex-col gap-4 border border-border-strong bg-surface-tint px-5 py-8"
          >
            <span className="font-body text-sm text-fg">{t(lang.value, "installed.empty")}</span>
            <p className="font-body text-sm text-fg-3">{t(lang.value, "installed.emptyHint")}</p>
            <div>
              <Button size="lg" variant="primary" onClick={onInstall}>
                {t(lang.value, "installed.install")}
              </Button>
            </div>
          </motion.div>
        </Case>
        <Case condition={filtered.length === 0}>
          <motion.div {...fadeUp(0.08)} className="border-t border-border py-8">
            <p className="font-body text-sm text-fg-3">{t(lang.value, "installed.noMatches")}</p>
          </motion.div>
        </Case>
        <Default>
          <motion.div
            {...fadeUp(0.06)}
            className={cn("grid", INSTALLED_GRID, "gap-4 border-b border-border pb-2")}
          >
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang.value, "installed.colName")}
            </span>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang.value, "installed.colSource")}
            </span>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang.value, "installed.colAgents")}
            </span>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
              {t(lang.value, "installed.colWhen")}
            </span>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
              {t(lang.value, "installed.colActions")}
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
                  lang={lang.value}
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
