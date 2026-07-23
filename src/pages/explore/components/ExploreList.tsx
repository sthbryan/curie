import { openUrl } from "@tauri-apps/plugin-opener";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Case, Default, Switch } from "react-if";
import { ActionProgress } from "@/components/ActionProgress";
import { Button } from "@/components/Button";
import type { ColumnDef } from "@/components/Table";
import { Table } from "@/components/Table";
import type { ExploreView, SkillExploreResult } from "@/components/types";
import { t } from "@/i18n";
import { cn } from "@/lib/cn";
import { fadeUp } from "@/lib/motion";
import { formatInstalls } from "@/lib/skills";
import { lang } from "@/store/system";

type Props = {
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

function formatChange(change: number | null): string | null {
  if (change === null || change === undefined) return null;
  if (change === 0) return "0";
  const abs = formatInstalls(Math.abs(change)) || String(Math.abs(change));
  return change > 0 ? `+${abs}` : `−${abs}`;
}

const EXPLORE_GRID = "grid-cols-[2.5rem_minmax(0,1.2fr)_minmax(0,1fr)_5.5rem_7rem]";

export function ExploreList({
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
  const columns = useMemo(
    (): ColumnDef<SkillExploreResult>[] => [
      {
        key: "rank",
        header: "#",
        headerClassName: "text-right",
        cellClassName: "pt-0.5 text-right",
        cell: (_result, index) => (
          <span className="font-mono uppercase tracking-label text-micro text-fg-4">
            {index + 1}
          </span>
        ),
      },
      {
        key: "name",
        header: t(lang.value, "explore.colName"),
        cellClassName: "min-w-0 flex flex-col gap-1",
        cell: (result) => (
          <>
            <span className="font-mono text-mono text-fg truncate">{result.name}</span>
            <span className="font-mono text-micro text-fg-4 truncate">{result.package}</span>
          </>
        ),
      },
      {
        key: "source",
        header: t(lang.value, "explore.colSource"),
        cellClassName: "min-w-0 flex flex-col gap-1",
        cell: (result) => (
          <>
            <span className="font-mono text-mono text-fg-2 truncate">{result.source || "—"}</span>
            <button
              type="button"
              onClick={() => void openUrl(result.url)}
              className="w-fit font-mono uppercase tracking-label text-micro text-fg-4 hover:text-fg truncate text-left"
            >
              {t(lang.value, "explore.open")}
            </button>
          </>
        ),
      },
      {
        key: "installs",
        header: t(lang.value, installsColumnKey(view)),
        headerClassName: "text-right",
        cellClassName: "flex flex-col items-end gap-0.5",
        cell: (result) => {
          const installs = formatInstalls(result.installs) || String(result.installs || 0);
          const changeLabel = view === "hot" ? formatChange(result.change) : null;
          const changeUp = (result.change ?? 0) > 0;
          const changeDown = (result.change ?? 0) < 0;
          return (
            <>
              <span className="font-mono uppercase tracking-label text-micro text-fg-3">
                {installs}
              </span>
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
            </>
          );
        },
      },
      {
        key: "actions",
        header: t(lang.value, "explore.colActions"),
        headerClassName: "text-right",
        cellClassName: "flex justify-end",
        cell: (result) => {
          const installed = installedPackages.has(result.package);
          const installing = installingPackage === result.package;
          return installed ? (
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang.value, "explore.installed")}
            </span>
          ) : installing ? (
            <ActionProgress active labelKey="explore.installing" />
          ) : (
            <Button
              size="xs"
              variant="primary"
              onClick={() => onInstall(result.package)}
              disabled={installBusy}
            >
              {t(lang.value, "explore.install")}
            </Button>
          );
        },
      },
    ],
    [lang.value, view, installedPackages, installingPackage, installBusy, onInstall],
  );

  return (
    <Switch>
      <Case condition={loading}>
        <Table
          columns={columns}
          rows={[]}
          gridTemplate={EXPLORE_GRID}
          loading
          skeletonRows={8}
          getRowKey={() => ""}
        />
      </Case>

      <Case condition={empty}>
        <motion.div
          {...fadeUp(0.08)}
          className="flex flex-col gap-2 border border-border-strong bg-surface-tint px-5 py-8"
        >
          <span className="font-body text-sm text-fg">{t(lang.value, "explore.empty")}</span>
          <p className="font-body text-sm text-fg-3">{t(lang.value, "explore.emptyHint")}</p>
        </motion.div>
      </Case>

      <Case condition={skills.length > 0}>
        <Table
          columns={columns}
          rows={skills}
          gridTemplate={EXPLORE_GRID}
          bodyKey={listKey}
          getRowKey={(r) => r.id}
        />
        {hasMore ? (
          <div className="flex justify-center pt-6">
            <Button
              size="md"
              variant="outline"
              onClick={onLoadMore}
              disabled={loadingMore || installBusy}
            >
              {loadingMore
                ? t(lang.value, "explore.loadingMore")
                : t(lang.value, "explore.loadMore")}
            </Button>
          </div>
        ) : null}
      </Case>

      <Default>{null}</Default>
    </Switch>
  );
}
