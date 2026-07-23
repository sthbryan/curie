import { openUrl } from "@tauri-apps/plugin-opener";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Case, Default, Switch } from "react-if";
import { ActionProgress } from "@/components/ActionProgress";
import { Button } from "@/components/Button";
import type { ColumnDef } from "@/components/Table";
import { Table } from "@/components/Table";
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
};

const FIND_GRID = "grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_4.5rem_7rem]";

export function ResultsPanel({
  showHint,
  loading,
  empty,
  results,
  installedPackages,
  installingPackage,
  installBusy,
  onInstall,
}: Props) {
  const t = useT();
  const columns = useMemo(
    (): ColumnDef<SkillSearchResult>[] => [
      {
        key: "name",
        header: t("find.colName"),
        cellClassName: "min-w-0 flex flex-col gap-1",
        cell: (result) => (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-mono text-mono text-fg truncate">{result.name}</span>
              {installedPackages.has(result.package) && (
                <span className="shrink-0 font-mono uppercase tracking-label text-micro text-fg-3 border border-border-strong px-1.5 py-0.5 rounded-sm">
                  {t("find.installed")}
                </span>
              )}
            </div>
            <span className="font-mono text-micro text-fg-4 truncate" title={result.package}>
              {result.package}
            </span>
          </>
        ),
      },
      {
        key: "source",
        header: t("find.colSource"),
        cellClassName: "min-w-0 flex flex-col gap-1",
        cell: (result) => (
          <>
            <span className="font-mono text-mono text-fg-2 truncate">{result.source || "—"}</span>
            <button
              type="button"
              onClick={() => void openUrl(result.url)}
              className="w-fit font-mono uppercase tracking-label text-micro text-fg-4 hover:text-fg truncate text-left"
            >
              {t("find.open")}
            </button>
          </>
        ),
      },
      {
        key: "installs",
        header: t("find.colInstalls"),
        headerClassName: "text-right",
        cellClassName: "text-right",
        cell: (result) => (
          <span className="font-mono uppercase tracking-label text-micro text-fg-3">
            {formatInstalls(result.installs) || "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: t("find.colActions"),
        headerClassName: "text-right",
        cellClassName: "flex justify-end",
        cell: (result) => {
          const installed = installedPackages.has(result.package);
          const installing = installingPackage === result.package;
          return installed ? (
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t("find.installed")}
            </span>
          ) : installing ? (
            <ActionProgress active labelKey="find.installing" />
          ) : (
            <Button
              size="xs"
              variant="primary"
              onClick={() => onInstall(result.package)}
              disabled={installBusy}
            >
              {t("find.install")}
            </Button>
          );
        },
      },
    ],
    [installedPackages, installingPackage, installBusy, onInstall],
  );

  return (
    <Switch>
      <Case condition={showHint}>
        <motion.div {...fadeUp(0.08)} className="border-t border-border py-8">
          <p className="font-body text-sm text-fg-3">{t("find.hint")}</p>
        </motion.div>
      </Case>

      <Case condition={loading}>
        <Table
          columns={columns}
          rows={[]}
          gridTemplate={FIND_GRID}
          loading
          skeletonRows={6}
          getRowKey={() => ""}
        />
      </Case>

      <Case condition={empty}>
        <motion.div
          {...fadeUp(0.08)}
          className="flex flex-col gap-2 border border-border-strong bg-surface-tint px-5 py-8"
        >
          <span className="font-body text-sm text-fg">{t("find.empty")}</span>
          <p className="font-body text-sm text-fg-3">{t("find.emptyHint")}</p>
        </motion.div>
      </Case>

      <Case condition={results.length > 0}>
        <Table columns={columns} rows={results} gridTemplate={FIND_GRID} getRowKey={(r) => r.id} />
      </Case>

      <Default>{null}</Default>
    </Switch>
  );
}
