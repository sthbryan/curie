import { openUrl } from "@tauri-apps/plugin-opener";
import { motion } from "motion/react";
import { Else, If, Then } from "react-if";
import { ActionProgress } from "@/components/ActionProgress";
import { Button } from "@/components/Button";
import type { ExploreView, SkillExploreResult } from "@/components/types";
import { t } from "@/i18n";
import { cn } from "@/lib/cn";
import { listItem } from "@/lib/motion";
import { formatInstalls } from "@/lib/skills";
import { lang } from "@/store/system";

type Props = {
  result: SkillExploreResult;
  rank: number;
  view: ExploreView;
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
        <span className="font-mono text-mono text-fg truncate">{result.name}</span>
        <span className="font-mono text-micro text-fg-4 truncate">{result.package}</span>
      </div>
      <div className="min-w-0 flex flex-col gap-1">
        <span className="font-mono text-mono text-fg-2 truncate">{result.source || "—"}</span>
        <button
          type="button"
          onClick={() => openUrl(result.url)}
          className="w-fit font-mono uppercase tracking-label text-micro text-fg-4 hover:text-fg truncate text-left"
        >
          {t(lang.value, "explore.open")}
        </button>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-mono uppercase tracking-label text-micro text-fg-3">{installs}</span>
        {changeLabel && (
          <span
            className={cn("font-mono uppercase tracking-label text-micro", {
              "text-success": changeUp,
              "text-accent": changeDown,
              "text-fg-4": !changeUp && !changeDown,
            })}
          >
            {changeLabel}
          </span>
        )}
      </div>
      <div className="flex justify-end">
        <If condition={installed}>
          <Then>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang.value, "explore.installed")}
            </span>
          </Then>
          <Else>
            <If condition={installing}>
              <Then>
                <ActionProgress active labelKey="explore.installing" />
              </Then>
              <Else>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => onInstall(result.package)}
                  disabled={installBusy}
                >
                  {t(lang.value, "explore.install")}
                </Button>
              </Else>
            </If>
          </Else>
        </If>
      </div>
    </motion.article>
  );
}
