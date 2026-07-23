import { openUrl } from "@tauri-apps/plugin-opener";
import { motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { Else, If, Then, When } from "react-if";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import type { ExploreView } from "@/components/types";
import { t } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { isSearchResultInstalled } from "@/lib/skills";
import { useSkillsStore } from "@/store/skills";
import { useSystemStore } from "@/store/system";
import { ExploreList } from "./components/ExploreList";
import { useExploreActions } from "./hooks/useExploreActions";

const VIEWS: ExploreView[] = ["hot", "trending", "all-time"];

export function Explore() {
  const lang = useSystemStore((s) => s.lang);
  const skills = useSkillsStore((s) => s.skills);
  const [, navigate] = useLocation();
  const {
    skills: exploreSkills,
    view,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    installing: installingPackage,
    installError,
    setView,
    load,
    loadMore,
    install: runInstall,
    dismissInstallError,
  } = useExploreActions("hot");

  useEffect(() => {
    void load("hot");
  }, [load]);

  const installedPackages = useMemo(
    () =>
      new Set(
        exploreSkills.filter((r) => isSearchResultInstalled(r, skills)).map((r) => r.package),
      ),
    [exploreSkills, skills],
  );

  const installBusy = installingPackage !== null;
  const showEmpty = !loading && !error && exploreSkills.length === 0;

  let statusLabel = t(lang, "explore.packageHint");
  if (loading) statusLabel = t(lang, "explore.loading");
  else if (exploreSkills.length > 0) {
    statusLabel = t(lang, "explore.showing", {
      n: exploreSkills.length,
      total: total || exploreSkills.length,
    });
  }

  const handleInstall = (pkg: string) => {
    runInstall(pkg).catch(() => {
      // hook keeps installError
    });
  };

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-10 pt-12 pb-8">
        <motion.section {...fadeUp(0)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label lang={lang}>{t(lang, "explore.eyebrow")}</Label>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2 min-w-0">
                <h2 className="font-display text-heading font-bold tracking-tight text-fg">
                  {t(lang, "explore.title")}
                </h2>
                <p className="font-body text-sm text-fg-3 max-w-lg">
                  {t(lang, "explore.subtitle")}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate("/find")}>
                  {t(lang, "explore.goFind")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void openUrl("https://skills.sh");
                  }}
                >
                  {t(lang, "explore.openSite")}
                </Button>
              </div>
            </div>
          </div>

          <When condition={Boolean(error || installError)}>
            <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
              <div className="min-w-0 flex flex-col gap-1">
                <span className="font-mono uppercase tracking-label text-micro text-accent">
                  <If condition={Boolean(error)}>
                    <Then>{t(lang, "explore.error")}</Then>
                    <Else>{t(lang, "explore.installError")}</Else>
                  </If>
                </span>
                <p className="font-body text-sm text-fg-3 break-all">{error ?? installError}</p>
              </div>
              <Button
                size="xs"
                variant="link"
                className="shrink-0 px-0"
                onClick={() => {
                  if (installError) dismissInstallError();
                  if (error) void load(view);
                }}
              >
                ×
              </Button>
            </div>
          </When>
        </motion.section>

        <motion.section {...fadeUp(0.05)} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {VIEWS.map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant="outline"
                  selected={view === v}
                  onClick={() => setView(v)}
                  disabled={loading && view === v}
                >
                  {t(lang, `explore.view.${v === "all-time" ? "allTime" : v}`)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono uppercase tracking-label text-micro text-fg-4">
                {statusLabel}
              </span>
              <Button size="sm" variant="ghost" onClick={() => void load(view)} disabled={loading}>
                {loading ? t(lang, "explore.refreshing") : t(lang, "explore.refresh")}
              </Button>
            </div>
          </div>
        </motion.section>

        <section className="flex flex-col">
          <ExploreList
            lang={lang}
            view={view}
            loading={loading}
            empty={showEmpty}
            skills={exploreSkills}
            listKey={view}
            installedPackages={installedPackages}
            installingPackage={installingPackage}
            installBusy={installBusy}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onInstall={handleInstall}
            onLoadMore={() => {
              void loadMore();
            }}
          />
        </section>
      </div>
    </main>
  );
}
