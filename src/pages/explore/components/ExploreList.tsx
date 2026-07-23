import { AnimatePresence, motion } from "motion/react";
import { Case, Default, Switch } from "react-if";
import { Button } from "@/components/Button";
import type { ExploreView, SkillExploreResult } from "@/components/types";
import type { Lang } from "@/i18n";
import { t } from "@/i18n";
import { fadeUp, listStagger } from "@/lib/motion";
import { ExploreRow } from "./ExploreRow";
import { ExploreSkeleton } from "./ExploreSkeleton";

type Props = {
  lang: Lang;
  view: ExploreView;
  loading: boolean;
  empty: boolean;
  skills: SkillExploreResult[];
  listKey: string;
  installedPackages: Set<string>;
  installingPackage: string | null;
  installBusy: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onInstall: (pkg: string) => void;
  onLoadMore: () => void;
};

function installsColumnKey(view: ExploreView): string {
  if (view === "hot") return "explore.colToday";
  if (view === "trending") return "explore.colTrend";
  return "explore.colInstalls";
}

export function ExploreList({
  lang,
  view,
  loading,
  empty,
  skills,
  listKey,
  installedPackages,
  installingPackage,
  installBusy,
  hasMore,
  loadingMore,
  onInstall,
  onLoadMore,
}: Props) {
  return (
    <Switch>
      <Case condition={loading}>
        <div aria-busy="true" aria-live="polite">
          <span className="sr-only">{t(lang, "explore.loading")}</span>
          <ExploreSkeleton rows={8} />
        </div>
      </Case>

      <Case condition={empty}>
        <motion.div
          {...fadeUp(0.08)}
          className="flex flex-col gap-2 border border-border-strong bg-surface-tint px-5 py-8"
        >
          <span className="font-body text-sm text-fg">{t(lang, "explore.empty")}</span>
          <p className="font-body text-sm text-fg-3">{t(lang, "explore.emptyHint")}</p>
        </motion.div>
      </Case>

      <Case condition={skills.length > 0}>
        <motion.div
          {...fadeUp(0.06)}
          className="grid grid-cols-[2.5rem_minmax(0,1.2fr)_minmax(0,1fr)_5.5rem_7rem] gap-4 border-b border-border pb-2"
        >
          <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
            #
          </span>
          <span className="font-mono uppercase tracking-label text-micro text-fg-4">
            {t(lang, "explore.colName")}
          </span>
          <span className="font-mono uppercase tracking-label text-micro text-fg-4">
            {t(lang, "explore.colSource")}
          </span>
          <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
            {t(lang, installsColumnKey(view))}
          </span>
          <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
            {t(lang, "explore.colActions")}
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
            {skills.map((result, index) => (
              <ExploreRow
                key={result.id}
                result={result}
                rank={index + 1}
                view={view}
                lang={lang}
                installed={installedPackages.has(result.package)}
                installing={installingPackage === result.package}
                installBusy={installBusy}
                onInstall={onInstall}
              />
            ))}
          </AnimatePresence>
        </motion.div>
        {hasMore ? (
          <div className="flex justify-center pt-6">
            <Button
              size="md"
              variant="outline"
              onClick={onLoadMore}
              disabled={loadingMore || installBusy}
            >
              {loadingMore ? t(lang, "explore.loadingMore") : t(lang, "explore.loadMore")}
            </Button>
          </div>
        ) : null}
      </Case>

      <Default>{null}</Default>
    </Switch>
  );
}
