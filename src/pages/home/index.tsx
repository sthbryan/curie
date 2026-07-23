import { motion } from "motion/react";
import { useMemo } from "react";
import { Label } from "../../components/Label";
import { t } from "../../i18n";
import { checkSkillUpdates, loadGlobalSkills } from "../../lib/boot";
import { fadeUp, listStagger, staggerContainer, staggerItem } from "../../lib/motion";
import {
  availableUpdates,
  buildRecentActivity,
  maxAgentCount,
  summarizeAgents,
} from "../../lib/skills";
import { useAppStore } from "../../store/app";
import { AgentRow } from "./components/AgentRow";
import { RecentRow } from "./components/RecentRow";
import { Stat } from "./components/Stat";
import { UpdateRow } from "./components/UpdateRow";

export function Home() {
  const lang = useAppStore((s) => s.lang);
  const setView = useAppStore((s) => s.setView);
  const skills = useAppStore((s) => s.skills);
  const skillsLoading = useAppStore((s) => s.skillsLoading);
  const skillsError = useAppStore((s) => s.skillsError);
  const skillUpdates = useAppStore((s) => s.skillUpdates);
  const updatesLoading = useAppStore((s) => s.updatesLoading);
  const updatesError = useAppStore((s) => s.updatesError);

  const agents = useMemo(() => summarizeAgents(skills), [skills]);
  const recent = useMemo(() => buildRecentActivity(skills), [skills]);
  const updates = useMemo(() => availableUpdates(skills, skillUpdates), [skills, skillUpdates]);
  const totalSkills = skills.length;
  const activeAgents = agents.length;
  const capacity = maxAgentCount(agents);
  const updateCount = updates.length;

  if (skillsLoading && totalSkills === 0) {
    return (
      <main className="flex min-w-0 flex-1 items-center justify-center">
        <span className="font-mono uppercase tracking-label text-mono text-fg-3 animate-pulse">
          {t(lang, "home.loading")}
        </span>
      </main>
    );
  }

  if (skillsError && totalSkills === 0) {
    return (
      <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 px-10">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <Label lang={lang} className="text-accent">
            {t(lang, "home.loadError")}
          </Label>
          <p className="font-body text-sm text-fg-3 break-all">{skillsError}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            loadGlobalSkills().catch(() => {
              // store handles error state
            });
          }}
          className="h-10 px-5 bg-fg text-bg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:opacity-90 transition-opacity duration-150"
        >
          {t(lang, "home.retry")}
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-10 pt-12 pb-8">
        <motion.section
          className="flex flex-col gap-5"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem} className="flex items-center gap-3">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                totalSkills > 0 ? "bg-success" : "bg-fg-4"
              }`}
            />
            <Label lang={lang}>
              {totalSkills > 0 ? t(lang, "home.status") : t(lang, "home.statusEmpty")}
            </Label>
          </motion.div>

          <motion.div
            className="flex items-stretch border-y border-border"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <Stat label={t(lang, "home.statSkills")} value={totalSkills} />
            <Stat label={t(lang, "home.statTools")} value={activeAgents} />
            <Stat
              label={t(lang, "home.statUpdates")}
              value={updatesLoading && skillUpdates.length === 0 ? "…" : updateCount}
              isLast
            />
          </motion.div>

          {totalSkills === 0 && (
            <motion.p {...fadeUp(0.08)} className="font-body text-sm text-fg-3">
              {t(lang, "home.skillsNone")}
            </motion.p>
          )}
        </motion.section>

        <motion.section
          className="grid grid-cols-2 gap-12"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem} className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between">
              <Label lang={lang}>{t(lang, "home.aiTools")}</Label>
              <Label lang={lang} className="text-micro">
                {t(lang, "home.active", { n: activeAgents })}
              </Label>
            </div>
            {agents.length === 0 ? (
              <p className="font-body text-sm text-fg-3 py-3 border-t border-border">
                {t(lang, "home.skillsNone")}
              </p>
            ) : (
              <motion.div
                className="flex flex-col"
                variants={listStagger}
                initial="initial"
                animate="animate"
              >
                {agents.map((agent) => (
                  <AgentRow key={agent.id} agent={agent} capacity={capacity} lang={lang} />
                ))}
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <div className="flex items-baseline justify-between gap-3">
                <Label lang={lang}>{t(lang, "home.updates")}</Label>
                <div className="flex items-center gap-3">
                  <Label lang={lang} className="text-micro">
                    {updatesLoading && skillUpdates.length === 0
                      ? t(lang, "home.updatesChecking")
                      : t(lang, "home.updatesAvailable", { n: updateCount })}
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      checkSkillUpdates().catch(() => {
                        // store handles error state
                      });
                    }}
                    disabled={updatesLoading}
                    className="font-mono uppercase tracking-label text-micro text-fg-3 hover:text-fg disabled:opacity-50 transition-colors duration-150"
                  >
                    {updatesLoading
                      ? t(lang, "home.updatesChecking")
                      : t(lang, "home.updatesCheck")}
                  </button>
                </div>
              </div>

              {updatesError ? (
                <p className="font-body text-sm text-fg-3 py-3 border-t border-border break-all">
                  {t(lang, "home.updatesError")}
                </p>
              ) : updatesLoading && skillUpdates.length === 0 ? (
                <p className="font-body text-sm text-fg-3 py-3 border-t border-border animate-pulse">
                  {t(lang, "home.updatesChecking")}
                </p>
              ) : updateCount === 0 ? (
                <p className="font-body text-sm text-fg-3 py-3 border-t border-border">
                  {totalSkills === 0 ? t(lang, "home.skillsNone") : t(lang, "home.noUpdates")}
                </p>
              ) : (
                <motion.div
                  className="flex flex-col"
                  variants={listStagger}
                  initial="initial"
                  animate="animate"
                >
                  {updates.map(({ skill, source }) => (
                    <UpdateRow key={skill.name} name={skill.name} source={source} lang={lang} />
                  ))}
                </motion.div>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-baseline justify-between">
                <Label lang={lang}>{t(lang, "home.recent")}</Label>
                <Label lang={lang} className="text-micro">
                  {t(lang, "home.events", { n: recent.length })}
                </Label>
              </div>
              {recent.length === 0 ? (
                <p className="font-body text-sm text-fg-3 py-3 border-t border-border">
                  {t(lang, "home.noRecent")}
                </p>
              ) : (
                <motion.div
                  className="flex flex-col"
                  variants={listStagger}
                  initial="initial"
                  animate="animate"
                >
                  {recent.map((event) => (
                    <RecentRow
                      key={`${event.kind}-${event.skill}-${event.at}`}
                      event={event}
                      lang={lang}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.section>

        <hr className="border-0 border-t border-border" />

        <motion.section {...fadeUp(0.12)} className="flex flex-col gap-5">
          <Label lang={lang}>{t(lang, "home.actions")}</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setView("search")}
              className="flex flex-1 items-center justify-between h-14 px-5 bg-fg text-bg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:opacity-90 active:scale-[0.99] transition-all duration-150"
            >
              <span>{t(lang, "home.install")}</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => setView("marketplace")}
              className="flex h-14 px-6 items-center justify-center border border-border-strong text-fg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:border-fg-3 active:scale-[0.99] transition-all duration-150"
            >
              {t(lang, "home.exploreBtn")}
            </button>
            <button
              type="button"
              onClick={() => setView("installed")}
              className="flex h-14 px-6 items-center justify-center text-fg-3 rounded-sm font-mono uppercase tracking-label text-mono hover:text-fg hover:bg-surface-hover active:scale-[0.99] transition-all duration-150"
            >
              {t(lang, "home.viewSkills")}
            </button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
