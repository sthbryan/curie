import { RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Case, Default, Else, If, Switch, Then, When } from "react-if";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { FullPageError } from "@/components/FullPageError";
import { FullPageLoading } from "@/components/FullPageLoading";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { checkSkillUpdates, loadGlobalSkills } from "@/lib/boot";
import { cn } from "@/lib/cn";
import { fadeUp, listStagger, staggerContainer, staggerItem } from "@/lib/motion";
import {
  availableUpdates,
  buildRecentActivity,
  maxAgentCount,
  summarizeAgents,
} from "@/lib/skills";
import { skillsStore } from "@/store/skills";
import { AgentRow } from "./components/AgentRow";
import { RecentRow } from "./components/RecentRow";
import { Stat } from "./components/Stat";
import { UpdateRow } from "./components/UpdateRow";

export function Home() {
  const t = useT();
  const [, navigate] = useLocation();
  const { skills, skillsLoading, skillsError, skillUpdates, updatesLoading, updatesError } =
    skillsStore;

  const agents = useMemo(() => summarizeAgents(skills.value), [skills.value]);
  const recent = useMemo(() => buildRecentActivity(skills.value), [skills.value]);
  const updates = useMemo(
    () => availableUpdates(skills.value, skillUpdates.value),
    [skills.value, skillUpdates.value],
  );
  const totalSkills = skills.value.length;
  const activeAgents = agents.length;
  const capacity = maxAgentCount(agents);
  const updateCount = updates.length;

  if (skillsLoading.value && totalSkills === 0) {
    return <FullPageLoading />;
  }

  if (skillsError.value && totalSkills === 0) {
    return (
      <FullPageError
        message={skillsError.value}
        onRetry={() => {
          loadGlobalSkills().catch(() => {
            // store handles error state
          });
        }}
      />
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
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                totalSkills > 0 ? "bg-success" : "bg-fg-4",
              )}
            />
            <Label>{totalSkills > 0 ? t("home.status") : t("home.statusEmpty")}</Label>
          </motion.div>

          <motion.div
            className="flex items-stretch border-y border-border"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <Stat label={t("home.statSkills")} value={totalSkills} />
            <Stat label={t("home.statTools")} value={activeAgents} />
            <Stat
              label={t("home.statUpdates")}
              value={updatesLoading.value && skillUpdates.value.length === 0 ? "…" : updateCount}
              isLast
            />
          </motion.div>

          <When condition={totalSkills === 0}>
            <motion.p {...fadeUp(0.08)} className="font-body text-sm text-fg-3">
              {t("home.skillsNone")}
            </motion.p>
          </When>
        </motion.section>

        <motion.section
          className="grid grid-cols-2 gap-12"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem} className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between">
              <Label>{t("home.aiTools")}</Label>
              <Label className="text-micro">{t("home.active", { n: activeAgents })}</Label>
            </div>
            <If condition={agents.length === 0}>
              <Then>
                <p className="font-body text-sm text-fg-3 py-3 border-t border-border">
                  {t("home.skillsNone")}
                </p>
              </Then>
              <Else>
                <motion.div
                  className="flex flex-col"
                  variants={listStagger}
                  initial="initial"
                  animate="animate"
                >
                  {agents.map((agent) => (
                    <AgentRow key={agent.id} agent={agent} capacity={capacity} />
                  ))}
                </motion.div>
              </Else>
            </If>
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <div className="flex items-baseline justify-between gap-3">
                <Label>{t("home.updates")}</Label>
                <div className="flex items-center gap-3">
                  <span className="font-mono uppercase tracking-label text-micro text-fg-3">
                    <If condition={updatesLoading.value && skillUpdates.value.length === 0}>
                      <Then>{t("home.updatesChecking")}</Then>
                      <Else>{t("home.updatesAvailable", { n: updateCount })}</Else>
                    </If>
                  </span>
                  <Button
                    size="xs"
                    variant="link"
                    className="px-0"
                    onClick={checkSkillUpdates}
                    disabled={updatesLoading.value}
                  >
                    <RotateCcw
                      size={10}
                      strokeWidth={1.5}
                      className={cn("transition-transform", updatesLoading.value && "animate-spin")}
                    />
                    <If condition={updatesLoading.value}>
                      <Then>{t("home.updatesChecking")}</Then>
                      <Else>{t("home.updatesCheck")}</Else>
                    </If>
                  </Button>
                </div>
              </div>

              <Switch>
                <Case condition={Boolean(updatesError.value)}>
                  <p className="font-body text-sm text-fg-3 py-3 border-t border-border break-all">
                    {t("home.updatesError")}
                  </p>
                </Case>
                <Case condition={updatesLoading.value && skillUpdates.value.length === 0}>
                  <p className="font-body text-sm text-fg-3 py-3 border-t border-border animate-pulse">
                    {t("home.updatesChecking")}
                  </p>
                </Case>
                <Case condition={updateCount === 0}>
                  <p className="font-body text-sm text-fg-3 py-3 border-t border-border">
                    <If condition={totalSkills === 0}>
                      <Then>{t("home.skillsNone")}</Then>
                      <Else>{t("home.noUpdates")}</Else>
                    </If>
                  </p>
                </Case>
                <Default>
                  <motion.div
                    className="flex flex-col"
                    variants={listStagger}
                    initial="initial"
                    animate="animate"
                  >
                    {updates.map(({ skill, source }) => (
                      <UpdateRow key={skill.name} name={skill.name} source={source} />
                    ))}
                  </motion.div>
                </Default>
              </Switch>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-baseline justify-between">
                <Label>{t("home.recent")}</Label>
                <Label className="text-micro">{t("home.events", { n: recent.length })}</Label>
              </div>
              <If condition={recent.length === 0}>
                <Then>
                  <p className="font-body text-sm text-fg-3 py-3 border-t border-border">
                    {t("home.noRecent")}
                  </p>
                </Then>
                <Else>
                  <motion.div
                    className="flex flex-col"
                    variants={listStagger}
                    initial="initial"
                    animate="animate"
                  >
                    {recent.map((event) => (
                      <RecentRow key={`${event.kind}-${event.skill}-${event.at}`} event={event} />
                    ))}
                  </motion.div>
                </Else>
              </If>
            </div>
          </motion.div>
        </motion.section>

        <hr className="border-0 border-t border-border" />

        <motion.section {...fadeUp(0.12)} className="flex flex-col gap-5">
          <Label>{t("home.actions")}</Label>
          <div className="flex gap-3">
            <Button
              size="hero"
              variant="primary"
              className="flex-1 justify-between"
              onClick={() => navigate("/find")}
            >
              <span>{t("home.install")}</span>
              <span>→</span>
            </Button>
            <Button
              size="hero"
              variant="outline"
              className="px-6 font-bold text-fg"
              onClick={() => navigate("/marketplace")}
            >
              {t("home.exploreBtn")}
            </Button>
            <Button
              size="hero"
              variant="ghost"
              className="px-6"
              onClick={() => navigate("/installed")}
            >
              {t("home.viewSkills")}
            </Button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
