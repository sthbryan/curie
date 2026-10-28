import { Button } from "@zovaris/sephiro/button";
import { EmptyState } from "@zovaris/sephiro/empty-state";
import { Table, type TableColumn } from "@zovaris/sephiro/table";
import { CloudDownload, Compass } from "lucide-react";
import { useMemo } from "react";
import { Case, Default, Switch } from "react-if";

import "@zovaris/sephiro/css/empty-state.css";
import "@zovaris/sephiro/css/table.css";

import { SkillInstallAction } from "@/components/discovery/SkillInstallAction";
import { SkillNameCell } from "@/components/discovery/SkillNameCell";
import { SkillSourceCell } from "@/components/discovery/SkillSourceCell";
import { ListSkeleton } from "@/components/ListSkeleton";
import { TableLabel } from "@/components/TableLabel";
import type { SkillSearchResult } from "@/components/types";
import { useT } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { formatInstalls } from "@/lib/skills";

type Props = {
  showHint: boolean;
  loading: boolean;
  empty: boolean;
  results: SkillSearchResult[];
  installedPackages: Set<string>;
  installingPackage: string | null;
  installBusy: boolean;
  onInstall: (pkg: string) => void;
  onGoExplore: () => void;
};

const FRAME = "min-h-0 max-h-full";
const ROW_HEIGHT = 61;

export function ResultsPanel({
  showHint,
  loading,
  empty,
  results,
  installedPackages,
  installingPackage,
  installBusy,
  onInstall,
  onGoExplore,
}: Props) {
  const t = useT("find");
  const columns = useMemo(
    (): TableColumn<SkillSearchResult>[] => [
      {
        key: "name",
        label: <TableLabel>{t("colName")}</TableLabel>,
        width: "38%",
        render: (result) => (
          <div className="flex min-w-0 flex-col gap-1">
            <SkillNameCell
              ns="find"
              name={result.name}
              pkg={result.package}
              installed={installedPackages.has(result.package)}
            />
          </div>
        ),
      },
      {
        key: "source",
        label: <TableLabel>{t("colSource")}</TableLabel>,
        width: "30%",
        render: (result) => (
          <div className="flex min-w-0 flex-col gap-1">
            <SkillSourceCell ns="find" source={result.source} url={result.url} />
          </div>
        ),
      },
      {
        key: "installs",
        label: <TableLabel>{t("colInstalls")}</TableLabel>,
        align: "end",
        width: "12%",
        render: (result) => (
          <span className="flex items-center justify-end gap-1 font-mono uppercase tracking-label text-micro text-fg-3">
            <CloudDownload size={10} />
            {formatInstalls(result.installs) || "—"}
          </span>
        ),
      },
      {
        key: "actions",
        label: <TableLabel>{t("colActions")}</TableLabel>,
        align: "end",
        width: "20%",
        render: (result) => (
          <div className="flex justify-end">
            <SkillInstallAction
              ns="find"
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
    [installedPackages, installingPackage, installBusy, onInstall, t],
  );

  return (
    <Switch>
      <Case condition={showHint}>
        <div {...fadeUp(0.08)}>
          <EmptyState
            icon={<Compass size={20} strokeWidth={1.5} />}
            title={t("hint")}
            description={t("hintExplore")}
            action={
              <Button size="sm" variant="secondary" onClick={onGoExplore}>
                {t("goExplore")}
              </Button>
            }
          />
        </div>
      </Case>

      <Case condition={loading}>
        <ListSkeleton rows={6} />
      </Case>

      <Case condition={empty}>
        <div {...fadeUp(0.08)}>
          <EmptyState title={t("empty")} description={t("emptyHint")} />
        </div>
      </Case>

      <Case condition={results.length > 0}>
        <Table
          className={FRAME}
          style={{ tableLayout: "fixed" }}
          columns={columns}
          rows={results}
          getRowId={(result) => result.id}
          stickyHeader
          virtualRowHeight={ROW_HEIGHT}
        />
      </Case>

      <Default>{null}</Default>
    </Switch>
  );
}
