import { openUrl } from "@tauri-apps/plugin-opener";
import { RefreshCw, Search, SquareArrowOutUpRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { Else, If, Then, When } from "react-if";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import type { ExploreView } from "@/components/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { fadeUp } from "@/lib/motion";
import { isSearchResultInstalled } from "@/lib/skills";
import { skills } from "@/store/skills";
import { ExploreList } from "./components/ExploreList";
import { useExploreActions } from "./hooks/useExploreActions";

const VIEWS: ExploreView[] = ["hot", "trending", "all-time"];

export function Explore() {
  const t = useT("explore");
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
        exploreSkills.filter((r) => isSearchResultInstalled(r, skills.value)).map((r) => r.package),
      ),
    [exploreSkills, skills.value],
  );

  const installBusy = installingPackage !== null;
  const showEmpty = !loading && !error && exploreSkills.length === 0;

  let statusLabel = t("packageHint");
  if (loading) statusLabel = t("loading");
  else if (exploreSkills.length > 0) {
    statusLabel = t("showing", {
      n: exploreSkills.length,
      total: total || exploreSkills.length,
    });
  }

  const handleGoFind = () => navigate("/find");
  const handleOpenSite = () => {
    void openUrl("https://skills.sh");
  };
  const handleDismissErrors = () => {
    if (installError) dismissInstallError();
    if (error) void load(view);
  };
  const tToast = useT();
  const handleRefresh = async () => {
    await load(view);
    toast.success(tToast("toast.refreshed"));
  };
  const handleLoadMore = () => {
    void loadMore();
  };

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
            <Label>{t("eyebrow")}</Label>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2 min-w-0">
                <h2 className="font-display text-heading font-bold tracking-tight text-fg">
                  {t("title")}
                </h2>
                <p className="font-body text-sm text-fg-3 max-w-lg">{t("subtitle")}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={handleGoFind}>
                  <Search size={14} />
                  {t("goFind")}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleOpenSite}>
                  <SquareArrowOutUpRight size={14} />
                  {t("openSite")}
                </Button>
              </div>
            </div>
          </div>

          <When condition={Boolean(error || installError)}>
            <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
              <div className="min-w-0 flex flex-col gap-1">
                <span className="font-mono uppercase tracking-label text-micro text-accent">
                  <If condition={Boolean(error)}>
                    <Then>{t("error")}</Then>
                    <Else>{t("installError")}</Else>
                  </If>
                </span>
                <p className="font-body text-sm text-fg-3 break-all">{error ?? installError}</p>
              </div>
              <Button
                size="xs"
                variant="link"
                className="shrink-0 px-0"
                onClick={handleDismissErrors}
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
                  size="xs"
                  variant="outline"
                  selected={view === v}
                  onClick={() => setView(v)}
                  disabled={loading && view === v}
                >
                  {t(`view.${v === "all-time" ? "allTime" : v}`)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono uppercase tracking-label text-micro text-fg-4">
                {statusLabel}
              </span>
              <Button size="xs" variant="ghost" onClick={handleRefresh} disabled={loading}>
                <RefreshCw
                  size={10}
                  className={cn("transition-transform", loading ? "animate-spin" : "")}
                />
                {loading ? t("refreshing") : t("refresh")}
              </Button>
            </div>
          </div>
        </motion.section>

        <section className="flex flex-col">
          <ExploreList
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
            onLoadMore={handleLoadMore}
          />
        </section>
      </div>
    </main>
  );
}
