import { motion } from "motion/react";
import { type ReactNode, useMemo } from "react";
import { Case, Default, Switch } from "react-if";
import { Button } from "@/components/Button";
import { SkillInstallAction } from "@/components/discovery/SkillInstallAction";
import { SkillNameCell } from "@/components/discovery/SkillNameCell";
import { SkillSourceCell } from "@/components/discovery/SkillSourceCell";
import type { ColumnDef } from "@/components/Table";
import { Table } from "@/components/Table";
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

const EXPLORE_GRID = "grid-cols-[2.5rem_minmax(0,1.2fr)_minmax(0,1fr)_5.5rem_7rem]";
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
        header: t("colName"),
        cellClassName: "min-w-0 flex flex-col gap-1",
        cell: (result) => (
          <SkillNameCell
            ns="explore"
            name={result.name}
            pkg={result.package}
            installed={installedPackages.has(result.package)}
            official={result.isOfficial}
          />
        ),
      },
      {
        key: "source",
        header: t("colSource"),
        cellClassName: "min-w-0 flex flex-col gap-1",
        cell: (result) => <SkillSourceCell ns="explore" source={result.source} url={result.url} />,
      },
      {
        key: "installs",
        header: t(installsColumnKey(view)),
        headerClassName: "text-right",
        cellClassName: "flex flex-col items-end gap-0.5",
        cell: (result) => <MetricCell view={view} result={result} />,
      },
      {
        key: "actions",
        header: t("colActions"),
        headerClassName: "text-right",
        cellClassName: "flex justify-end",
        cell: (result) => (
          <SkillInstallAction
            ns="explore"
            pkg={result.package}
            installed={installedPackages.has(result.package)}
            installing={installingPackage === result.package}
            busy={installBusy}
            onInstall={onInstall}
          />
        ),
      },
    ],
    [view, installedPackages, installingPackage, installBusy, onInstall],
  );

  let footer: ReactNode = null;
  if (hasMore) {
    footer = (
      <div className="flex justify-center py-6">
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
      <div className="flex justify-center py-6">
        <span className="font-mono uppercase tracking-label text-micro text-fg-4">
          {t("capReached", { n: MAX_EXPLORE_SKILLS })}
        </span>
      </div>
    );
  }

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
          <span className="font-body text-sm text-fg">{t("empty")}</span>
          <p className="font-body text-sm text-fg-3">{t("emptyHint")}</p>
        </motion.div>
      </Case>

      <Case condition={skills.length > 0}>
        <Table
          columns={columns}
          rows={skills}
          gridTemplate={EXPLORE_GRID}
          rowHeight={ROW_HEIGHT}
          getRowKey={(r) => r.id}
          viewportClassName="pr-1"
          footer={footer}
        />
      </Case>

      <Default>{null}</Default>
    </Switch>
  );
}
