import { Table, type TableColumn } from "@zovaris/sephiro/table";
import { type ReactNode, useMemo } from "react";
import { Case, Default, Switch } from "react-if";

import "@zovaris/sephiro/css/table.css";

import { Button } from "@/components/Button";
import { SkillInstallAction } from "@/components/discovery/SkillInstallAction";
import { SkillNameCell } from "@/components/discovery/SkillNameCell";
import { SkillSourceCell } from "@/components/discovery/SkillSourceCell";
import { ListSkeleton } from "@/components/ListSkeleton";
import type { ExploreView, SkillExploreResult } from "@/components/types";
import { useT } from "@/i18n";
import { fadeUp } from "@/lib/motion";

import { MAX_EXPLORE_SKILLS } from "../hooks/useExploreActions";
import { MetricCell } from "./MetricCell";

type Props = {
  view: ExploreView;
  loading: boolean;
  empty: boolean;
  skills: SkillExploreResult[];
  installedPackages: Set<string>;
  installingPackage: string | null;
  installBusy: boolean;
  hasMore: boolean;
  atCap: boolean;
  loadingMore: boolean;
  onInstall: (pkg: string) => void;
  onLoadMore: () => void;
};

function installsColumnKey(view: ExploreView): string {
  if (view === "hot") return "colToday";
  if (view === "trending") return "colTrend";
  return "colInstalls";
}

const FRAME = "min-h-0 max-h-full";
const ROW_HEIGHT = 61;

export function ExploreList({
  view,
  loading,
  empty,
  skills,
  installedPackages,
  installingPackage,
  installBusy,
  hasMore,
  atCap,
  loadingMore,
  onInstall,
  onLoadMore,
}: Props) {
  const t = useT("explore");
  const columns = useMemo(
    (): TableColumn<SkillExploreResult>[] => [
      {
        key: "rank",
        label: "#",
        align: "end",
        width: "8%",
        render: (_result, index) => (
          <span className="font-mono uppercase tracking-label text-micro text-fg-4">
            {index + 1}
          </span>
        ),
      },
      {
        key: "name",
        label: t("colName"),
        width: "34%",
        render: (result) => (
          <div className="flex min-w-0 flex-col gap-1">
            <SkillNameCell
              ns="explore"
              name={result.name}
              pkg={result.package}
              installed={installedPackages.has(result.package)}
              official={result.isOfficial}
            />
          </div>
        ),
      },
      {
        key: "source",
        label: t("colSource"),
        width: "26%",
        render: (result) => (
          <div className="flex min-w-0 flex-col gap-1">
            <SkillSourceCell ns="explore" source={result.source} url={result.url} />
          </div>
        ),
      },
      {
        key: "installs",
        label: t(installsColumnKey(view)),
        align: "end",
        width: "12%",
        render: (result) => (
          <div className="flex flex-col items-end gap-0.5">
            <MetricCell view={view} result={result} />
          </div>
        ),
      },
      {
        key: "actions",
        label: t("colActions"),
        align: "end",
        width: "20%",
        render: (result) => (
          <div className="flex justify-end">
            <SkillInstallAction
              ns="explore"
              pkg={result.package}
              installed={installedPackages.has(result.package)}
              installing={installingPackage === result.package}
              busy={installBusy}
              onInstall={onInstall}
            />
          </div>
        ),
      },
    ],
    [view, installedPackages, installingPackage, installBusy, onInstall, t],
  );

  let footer: ReactNode = null;
  if (hasMore) {
    footer = (
      <div className="flex shrink-0 justify-center py-4">
        <Button
          size="sm"
          variant="outline"
          onClick={onLoadMore}
          disabled={loadingMore || installBusy}
        >
          {loadingMore ? t("loadingMore") : t("loadMore")}
        </Button>
      </div>
    );
  } else if (atCap) {
    footer = (
      <div className="flex shrink-0 justify-center py-4">
        <span className="font-mono uppercase tracking-label text-micro text-fg-4">
          {t("capReached", { n: MAX_EXPLORE_SKILLS })}
        </span>
      </div>
    );
  }

  return (
    <Switch>
      <Case condition={loading}>
        <ListSkeleton rows={8} />
      </Case>

      <Case condition={empty}>
        <div
          {...fadeUp(0.08)}
          className="flex flex-col gap-2 border border-border-strong bg-surface-tint px-5 py-8"
        >
          <span className="font-body text-sm text-fg">{t("empty")}</span>
          <p className="font-body text-sm text-fg-3">{t("emptyHint")}</p>
        </div>
      </Case>

      <Case condition={skills.length > 0}>
        <>
          <Table
            className={FRAME}
            style={{ tableLayout: "fixed" }}
            columns={columns}
            rows={skills}
            getRowId={(result) => result.id}
            stickyHeader
            virtualRowHeight={ROW_HEIGHT}
          />
          {footer}
        </>
      </Case>

      <Default>{null}</Default>
    </Switch>
  );
}
