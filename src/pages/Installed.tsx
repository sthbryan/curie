import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Label } from "../components/Label";
import type { SkillInfo } from "../components/types";
import { t } from "../i18n";
import { loadGlobalSkills } from "../lib/boot";
import { fadeUp, listItem, listStagger } from "../lib/motion";
import { filterSkills, formatRelative, skillTimestamp, summarizeAgents } from "../lib/skills";
import { useAppStore } from "../store/app";

function AgentBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-36 truncate border border-border px-1.5 py-0.5 font-mono uppercase tracking-label text-micro text-fg-3">
      {label}
    </span>
  );
}

function SkillRow({ skill, lang }: { skill: SkillInfo; lang: "en" | "es" }) {
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

export function Installed() {
  const lang = useAppStore((s) => s.lang);
  const setView = useAppStore((s) => s.setView);
  const skills = useAppStore((s) => s.skills);
  const skillsLoading = useAppStore((s) => s.skillsLoading);
  const skillsError = useAppStore((s) => s.skillsError);

  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string | null>(null);

  const agents = useMemo(() => summarizeAgents(skills), [skills]);
  const filtered = useMemo(
    () => filterSkills(skills, query, agentFilter),
    [skills, query, agentFilter],
  );

  if (skillsLoading && skills.length === 0) {
    return (
      <main className="flex min-w-0 flex-1 items-center justify-center">
        <span className="font-mono uppercase tracking-label text-mono text-fg-3 animate-pulse">
          {t(lang, "home.loading")}
        </span>
      </main>
    );
  }

  if (skillsError && skills.length === 0) {
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-10 pt-12 pb-8">
        <motion.section {...fadeUp(0)} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-3">
              <Label lang={lang}>{t(lang, "installed.eyebrow")}</Label>
              <h2 className="font-display text-heading font-bold tracking-tight text-fg">
                {t(lang, "installed.title")}
              </h2>
              <p className="font-body text-sm text-fg-3 max-w-lg">
                {t(lang, "installed.subtitle", { n: skills.length })}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  loadGlobalSkills().catch(() => {
                    // store handles error state
                  });
                }}
                disabled={skillsLoading}
                className="h-9 px-4 border border-border-strong text-fg-2 rounded-sm font-mono uppercase tracking-label text-mono hover:border-fg-3 hover:text-fg disabled:opacity-50 transition-colors duration-150"
              >
                {skillsLoading ? t(lang, "installed.refreshing") : t(lang, "installed.refresh")}
              </button>
              <button
                type="button"
                onClick={() => setView("search")}
                className="h-9 px-4 bg-fg text-bg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:opacity-90 transition-opacity duration-150"
              >
                {t(lang, "installed.install")}
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section {...fadeUp(0.05)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative flex min-w-0 flex-1 max-w-md">
              <span className="sr-only">{t(lang, "installed.search")}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(lang, "installed.searchPlaceholder")}
                className="h-10 w-full border border-border-strong bg-bg px-3 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm"
              />
            </label>

            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang, "installed.showing", { n: filtered.length, total: skills.length })}
            </span>
          </div>

          {agents.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAgentFilter(null)}
                className={`h-8 px-3 font-mono uppercase tracking-label text-micro transition-colors duration-150 rounded-sm ${
                  agentFilter === null
                    ? "bg-fg text-bg font-bold"
                    : "border border-border-strong text-fg-3 hover:border-fg-3 hover:text-fg"
                }`}
              >
                {t(lang, "installed.filterAll")}
              </button>
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setAgentFilter(agent.label === agentFilter ? null : agent.label)}
                  className={`h-8 px-3 font-mono uppercase tracking-label text-micro transition-colors duration-150 rounded-sm ${
                    agentFilter === agent.label
                      ? "bg-fg text-bg font-bold"
                      : "border border-border-strong text-fg-3 hover:border-fg-3 hover:text-fg"
                  }`}
                >
                  {agent.label}
                  <span className="ml-2 opacity-60">{agent.count}</span>
                </button>
              ))}
            </div>
          )}
        </motion.section>

        <section className="flex flex-col">
          {skills.length === 0 ? (
            <motion.div
              {...fadeUp(0.08)}
              className="flex flex-col gap-4 border border-border-strong bg-surface-tint px-5 py-8"
            >
              <span className="font-body text-sm text-fg">{t(lang, "installed.empty")}</span>
              <p className="font-body text-sm text-fg-3">{t(lang, "installed.emptyHint")}</p>
              <div>
                <button
                  type="button"
                  onClick={() => setView("search")}
                  className="h-10 px-5 bg-fg text-bg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:opacity-90 transition-opacity duration-150"
                >
                  {t(lang, "installed.install")}
                </button>
              </div>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div {...fadeUp(0.08)} className="border-t border-border py-8">
              <p className="font-body text-sm text-fg-3">{t(lang, "installed.noMatches")}</p>
            </motion.div>
          ) : (
            <>
              <motion.div
                {...fadeUp(0.06)}
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_5.5rem] gap-4 border-b border-border pb-2"
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
              </motion.div>
              <motion.div
                key={`${agentFilter ?? "all"}:${query}`}
                className="flex flex-col"
                variants={listStagger}
                initial="initial"
                animate="animate"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {filtered.map((skill) => (
                    <SkillRow key={`${skill.name}-${skill.path}`} skill={skill} lang={lang} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
