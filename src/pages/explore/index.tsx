import { openUrl } from "@tauri-apps/plugin-opener";
import { RefreshCw, Search, SquareArrowOutUpRight } from "lucide-react";
import { motion, useReducedMotionConfig } from "motion/react";
import { useEffect, useMemo } from "react";
import { When } from "react-if";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { ChoiceButton } from "@/components/ChoiceButton";
import { ErrorNotice } from "@/components/ErrorNotice";
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
  const shouldReduceMotion = useReducedMotionConfig();
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
    dismissError,
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
  const handleRetry = () => {
    void load(view);
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
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-8 px-10 pt-12 pb-8">
        <motion.section {...fadeUp(0)} className="flex shrink-0 flex-col gap-4">
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

          <When condition={error !== null}>
            <ErrorNotice
              title={t("error")}
              message={error ?? ""}
              onRetry={handleRetry}
              onDismiss={dismissError}
            />
          </When>

          <When condition={installError !== null}>
            <ErrorNotice
              title={t("installError")}
              message={installError ?? ""}
              onDismiss={dismissInstallError}
            />
          </When>
        </motion.section>

        <motion.section
          {...fadeUp(0.05)}
          className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border pb-4"
        >
          <div className="flex">
            {VIEWS.map((v) => {
              const handlePickView = () => {
                setView(v);
              };
              return (
                <ChoiceButton
                  key={v}
                  active={view === v}
                  label={t(`view.${v === "all-time" ? "allTime" : v}`)}
                  onClick={handlePickView}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <span
              aria-live="polite"
              className="font-mono uppercase tracking-label text-micro text-fg-4"
            >
              {statusLabel}
            </span>
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw
                size={11}
                strokeWidth={1.5}
                className={cn(loading && !shouldReduceMotion && "animate-spin")}
              />
              {loading ? t("refreshing") : t("refresh")}
            </Button>
          </div>
        </motion.section>

        <section className="flex min-h-0 flex-1 flex-col">
          <ExploreList
            view={view}
            loading={loading}
            empty={showEmpty}
            skills={exploreSkills}
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
