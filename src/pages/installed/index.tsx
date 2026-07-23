import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Case, Default, Else, If, Switch, Then, When } from "react-if";
import { useLocation } from "wouter";
import { Button } from "../../components/Button";
import { Label } from "../../components/Label";
import { t } from "../../i18n";
import { loadGlobalSkills, removeSkills, updateSkills } from "../../lib/boot";
import { fadeUp, listStagger } from "../../lib/motion";
import { filterSkills, summarizeAgents, updateNameSet } from "../../lib/skills";
import { useAppStore } from "../../store/app";
import { SkillRow } from "./components/SkillRow";

export function Installed() {
  const lang = useAppStore((s) => s.lang);
  const [, navigate] = useLocation();
  const skills = useAppStore((s) => s.skills);
  const skillsLoading = useAppStore((s) => s.skillsLoading);
  const skillsError = useAppStore((s) => s.skillsError);
  const skillUpdates = useAppStore((s) => s.skillUpdates);
  const updatesLoading = useAppStore((s) => s.updatesLoading);
  const updatingSkill = useAppStore((s) => s.updatingSkill);
  const updateApplyError = useAppStore((s) => s.updateApplyError);
  const setUpdateApplyError = useAppStore((s) => s.setUpdateApplyError);
  const removingSkill = useAppStore((s) => s.removingSkill);
  const removeError = useAppStore((s) => s.removeError);
  const setRemoveError = useAppStore((s) => s.setRemoveError);

  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const [updatesOnly, setUpdatesOnly] = useState(false);

  const agents = useMemo(() => summarizeAgents(skills), [skills]);
  const updateNames = useMemo(() => updateNameSet(skillUpdates), [skillUpdates]);
  const updateCount = updateNames.size;
  const actionBusy = updatingSkill !== null || removingSkill !== null;
  const filtered = useMemo(
    () =>
      filterSkills(skills, query, agentFilter, {
        updatesOnly,
        updateNames,
      }),
    [skills, query, agentFilter, updatesOnly, updateNames],
  );

  const handleUpdateOne = (name: string) => {
    updateSkills([name]).catch(() => {
      // store keeps updateApplyError
    });
  };

  const handleUpdateAll = () => {
    const names = [...updateNames];
    updateSkills(names.length > 0 ? names : undefined).catch(() => {
      // store keeps updateApplyError
    });
  };

  const handleRemoveOne = (name: string) => {
    removeSkills([name]).catch(() => {
      // store keeps removeError
    });
  };

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
        <Button
          size="lg"
          variant="primary"
          onClick={() => {
            loadGlobalSkills().catch(() => {
              // store handles error state
            });
          }}
        >
          {t(lang, "home.retry")}
        </Button>
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
                {updateCount > 0
                  ? ` · ${t(lang, "installed.updatesHint", { n: updateCount })}`
                  : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 pt-1">
              <When condition={updateCount > 0}>
                <Button
                  size="md"
                  variant="accent-outline"
                  className="font-bold"
                  onClick={handleUpdateAll}
                  disabled={actionBusy || updatesLoading}
                >
                  <If condition={updatingSkill === "*"}>
                    <Then>{t(lang, "installed.updatingAll")}</Then>
                    <Else>{t(lang, "installed.updateAll")}</Else>
                  </If>
                </Button>
              </When>
              <Button
                size="md"
                variant="outline"
                onClick={() => {
                  loadGlobalSkills().catch(() => {
                    // store handles error state
                  });
                }}
                disabled={skillsLoading || updatesLoading || actionBusy}
              >
                <If condition={skillsLoading || updatesLoading}>
                  <Then>{t(lang, "installed.refreshing")}</Then>
                  <Else>{t(lang, "installed.refresh")}</Else>
                </If>
              </Button>
              <Button size="md" variant="primary" onClick={() => navigate("/find")}>
                {t(lang, "installed.install")}
              </Button>
            </div>
          </div>

          <When condition={Boolean(updateApplyError || removeError)}>
            <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
              <div className="min-w-0 flex flex-col gap-1">
                <span className="font-mono uppercase tracking-label text-micro text-accent">
                  <If condition={Boolean(updateApplyError)}>
                    <Then>{t(lang, "installed.updateError")}</Then>
                    <Else>{t(lang, "installed.removeError")}</Else>
                  </If>
                </span>
                <p className="font-body text-sm text-fg-3 break-all">
                  {updateApplyError ?? removeError}
                </p>
              </div>
              <Button
                size="xs"
                variant="link"
                className="shrink-0 px-0"
                onClick={() => {
                  setUpdateApplyError(null);
                  setRemoveError(null);
                }}
              >
                ×
              </Button>
            </div>
          </When>
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

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              selected={agentFilter === null && !updatesOnly}
              onClick={() => {
                setAgentFilter(null);
                setUpdatesOnly(false);
              }}
            >
              {t(lang, "installed.filterAll")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              selected={updatesOnly}
              onClick={() => {
                setUpdatesOnly((v) => !v);
                setAgentFilter(null);
              }}
            >
              {t(lang, "installed.filterUpdates")}
              <span className="ml-2 opacity-60">{updateCount}</span>
            </Button>
            {agents.map((agent) => (
              <Button
                key={agent.id}
                size="sm"
                variant="outline"
                selected={agentFilter === agent.label}
                onClick={() => {
                  setUpdatesOnly(false);
                  setAgentFilter(agent.label === agentFilter ? null : agent.label);
                }}
              >
                {agent.label}
                <span className="ml-2 opacity-60">{agent.count}</span>
              </Button>
            ))}
          </div>
        </motion.section>

        <section className="flex flex-col">
          <Switch>
            <Case condition={skills.length === 0}>
              <motion.div
                {...fadeUp(0.08)}
                className="flex flex-col gap-4 border border-border-strong bg-surface-tint px-5 py-8"
              >
                <span className="font-body text-sm text-fg">{t(lang, "installed.empty")}</span>
                <p className="font-body text-sm text-fg-3">{t(lang, "installed.emptyHint")}</p>
                <div>
                  <Button size="lg" variant="primary" onClick={() => navigate("/find")}>
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
                key={`${agentFilter ?? "all"}:${query}:${updatesOnly ? "up" : "all"}`}
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
                      onUpdate={handleUpdateOne}
                      onRemove={handleRemoveOne}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </Default>
          </Switch>
        </section>
      </div>
    </main>
  );
}
