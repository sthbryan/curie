import { motion } from "motion/react";
import { useMemo } from "react";
import { Label } from "../components/Label";
import { t } from "../i18n";
import { loadGlobalSkills } from "../lib/boot";
import { fadeUp, listItem, listStagger, staggerContainer, staggerItem } from "../lib/motion";
import { buildRecentActivity, maxAgentCount, summarizeAgents } from "../lib/skills";
import { useAppStore } from "../store/app";

function density(count: number, capacity: number): number {
  return Math.min(count / capacity, 1);
}

function Stat({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: number;
  isLast?: boolean;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={`flex min-w-0 flex-1 flex-col gap-2 py-5 ${
        isLast ? "" : "border-r border-border pr-6 mr-6"
      }`}
    >
      <span className="font-mono uppercase tracking-label text-micro text-fg-4">{label}</span>
      <span className="font-display text-heading font-bold leading-none tracking-tight text-fg tabular-nums">
        {value}
      </span>
    </motion.div>
  );
}

export function Home() {
  const lang = useAppStore((s) => s.lang);
  const setView = useAppStore((s) => s.setView);
  const skills = useAppStore((s) => s.skills);
  const skillsLoading = useAppStore((s) => s.skillsLoading);
  const skillsError = useAppStore((s) => s.skillsError);

  const agents = useMemo(() => summarizeAgents(skills), [skills]);
  const recent = useMemo(() => buildRecentActivity(skills), [skills]);
  const totalSkills = skills.length;
  const activeAgents = agents.length;
  const capacity = maxAgentCount(agents);

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
            <Stat label={t(lang, "home.statRecent")} value={recent.length} isLast />
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
                  <motion.div
                    key={agent.id}
                    variants={listItem}
                    className="flex items-center gap-4 border-b border-border py-3 first:border-t"
                  >
                    <span className="font-mono text-mono text-fg-2 w-32 truncate">
                      {agent.label}
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="relative h-1.5 flex-1 bg-border overflow-hidden rounded-sm">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-fg-2"
                          initial={{ width: 0 }}
                          animate={{ width: `${density(agent.count, capacity) * 100}%` }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-mono font-bold leading-none tracking-tight w-5 text-right text-fg tabular-nums">
                      {agent.count}
                    </span>
                    <span className="font-mono uppercase tracking-label text-micro w-14 text-right text-fg-4">
                      {agent.count === 1 ? t(lang, "home.skillWord") : t(lang, "home.skillsWord")}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col gap-5">
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
                  <motion.div
                    key={`${event.kind}-${event.skill}-${event.at}`}
                    variants={listItem}
                    className="flex items-baseline gap-3 border-b border-border py-3 first:border-t"
                  >
                    <span className="font-mono uppercase tracking-label text-micro text-fg-3 w-16 shrink-0">
                      {event.kind === "install"
                        ? t(lang, "home.kindInstall")
                        : t(lang, "home.kindUpdate")}
                    </span>
                    <span className="font-mono text-mono text-fg grow truncate">{event.skill}</span>
                    <Label lang={lang} className="text-micro w-28 truncate text-right">
                      {event.source ?? "local"}
                    </Label>
                    <Label lang={lang} className="text-micro w-20 text-right shrink-0">
                      {event.when}
                    </Label>
                  </motion.div>
                ))}
              </motion.div>
            )}
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
