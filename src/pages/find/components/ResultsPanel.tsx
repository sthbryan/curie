import { AnimatePresence, motion } from "motion/react";
import { Case, Default, Switch } from "react-if";
import type { SkillSearchResult } from "@/components/types";
import type { Lang } from "@/i18n";
import { t } from "@/i18n";
import { fadeUp, listStagger } from "@/lib/motion";
import { ResultRow } from "./ResultRow";
import { ResultSkeleton } from "./ResultSkeleton";

type Props = {
  lang: Lang;
  showHint: boolean;
  loading: boolean;
  empty: boolean;
  results: SkillSearchResult[];
  listKey: string;
  installedPackages: Set<string>;
  installingPackage: string | null;
  installBusy: boolean;
  onInstall: (pkg: string) => void;
};

export function ResultsPanel({
  lang,
  showHint,
  loading,
  empty,
  results,
  listKey,
  installedPackages,
  installingPackage,
  installBusy,
  onInstall,
}: Props) {
  return (
    <Switch>
      <Case condition={showHint}>
        <motion.div {...fadeUp(0.08)} className="border-t border-border py-8">
          <p className="font-body text-sm text-fg-3">{t(lang, "find.hint")}</p>
        </motion.div>
      </Case>

      <Case condition={loading}>
        <div aria-busy="true" aria-live="polite">
          <span className="sr-only">{t(lang, "find.searching")}</span>
          <ResultSkeleton rows={6} />
        </div>
      </Case>

      <Case condition={empty}>
        <motion.div
          {...fadeUp(0.08)}
          className="flex flex-col gap-2 border border-border-strong bg-surface-tint px-5 py-8"
        >
          <span className="font-body text-sm text-fg">{t(lang, "find.empty")}</span>
          <p className="font-body text-sm text-fg-3">{t(lang, "find.emptyHint")}</p>
        </motion.div>
      </Case>

      <Case condition={results.length > 0}>
        <motion.div
          {...fadeUp(0.06)}
          className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_4.5rem_7rem] gap-4 border-b border-border pb-2"
        >
          <span className="font-mono uppercase tracking-label text-micro text-fg-4">
            {t(lang, "find.colName")}
          </span>
          <span className="font-mono uppercase tracking-label text-micro text-fg-4">
            {t(lang, "find.colSource")}
          </span>
          <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
            {t(lang, "find.colInstalls")}
          </span>
          <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
            {t(lang, "find.colActions")}
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
            {results.map((result) => (
              <ResultRow
                key={result.id}
                result={result}
                lang={lang}
                installed={installedPackages.has(result.package)}
                installing={installingPackage === result.package}
                installBusy={installBusy}
                onInstall={onInstall}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </Case>

      <Default>{null}</Default>
    </Switch>
  );
}
