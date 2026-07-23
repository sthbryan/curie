import { openUrl } from "@tauri-apps/plugin-opener";
import { motion } from "motion/react";
import { Else, If, Then, When } from "react-if";
import { ActionProgress } from "@/components/ActionProgress";
import { Button } from "@/components/Button";
import type { ExploreView, SkillExploreResult } from "@/components/types";
import type { Lang } from "@/i18n";
import { t } from "@/i18n";
import { listItem } from "@/lib/motion";
import { formatInstalls } from "@/lib/skills";

type Props = {
  result: SkillExploreResult;
  rank: number;
  view: ExploreView;
  lang: Lang;
  installed: boolean;
  installing: boolean;
  installBusy: boolean;
  onInstall: (pkg: string) => void;
};

function formatChange(change: number | null): string | null {
  if (change === null || change === undefined) return null;
  if (change === 0) return "0";
  const abs = formatInstalls(Math.abs(change)) || String(Math.abs(change));
  return change > 0 ? `+${abs}` : `−${abs}`;
}

export function ExploreRow({
  result,
  rank,
  view,
  lang,
  installed,
  installing,
  installBusy,
  onInstall,
}: Props) {
  const installs = formatInstalls(result.installs) || String(result.installs || 0);
  const changeLabel = view === "hot" ? formatChange(result.change) : null;
  const changeUp = (result.change ?? 0) > 0;
  const changeDown = (result.change ?? 0) < 0;

  return (
    <motion.article
      layout
      variants={listItem}
      className="grid grid-cols-[2.5rem_minmax(0,1.2fr)_minmax(0,1fr)_5.5rem_7rem] items-start gap-4 border-b border-border py-4 first:border-t"
    >
      <div className="pt-0.5 text-right">
        <span className="font-mono uppercase tracking-label text-micro text-fg-4">{rank}</span>
      </div>

      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-mono text-fg truncate">{result.name}</span>
          <When condition={result.isOfficial}>
            <span className="shrink-0 font-mono uppercase tracking-label text-micro text-fg-3 border border-border-strong px-1.5 py-0.5 rounded-sm">
              {t(lang, "explore.official")}
            </span>
          </When>
          <When condition={installed}>
            <span className="shrink-0 font-mono uppercase tracking-label text-micro text-fg-3 border border-border-strong px-1.5 py-0.5 rounded-sm">
              {t(lang, "explore.installed")}
            </span>
          </When>
        </div>
        <span className="font-mono text-micro text-fg-4 truncate" title={result.package}>
          {result.package}
        </span>
      </div>

      <div className="min-w-0 flex flex-col gap-1">
        <span className="font-mono text-mono text-fg-2 truncate">{result.source || "—"}</span>
        <button
          type="button"
          onClick={() => {
            void openUrl(result.url);
          }}
          className="w-fit font-mono uppercase tracking-label text-micro text-fg-4 hover:text-fg truncate text-left"
        >
          {t(lang, "explore.open")}
        </button>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <span className="font-mono uppercase tracking-label text-micro text-fg-3">{installs}</span>
        <When condition={Boolean(changeLabel)}>
          <span
            className={`font-mono uppercase tracking-label text-micro ${
              changeUp ? "text-success" : changeDown ? "text-accent" : "text-fg-4"
            }`}
          >
            {changeLabel}
          </span>
        </When>
      </div>

      <div className="flex justify-end">
        <If condition={installed}>
          <Then>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang, "explore.installed")}
            </span>
          </Then>
          <Else>
            <If condition={installing}>
              <Then>
                <ActionProgress active lang={lang} labelKey="explore.installing" />
              </Then>
              <Else>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => onInstall(result.package)}
                  disabled={installBusy}
                >
                  {t(lang, "explore.install")}
                </Button>
              </Else>
            </If>
          </Else>
        </If>
      </div>
    </motion.article>
  );
}
