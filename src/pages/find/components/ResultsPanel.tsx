import { CloudDownload } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Case, Default, Switch } from "react-if";
import { SkillInstallAction } from "@/components/discovery/SkillInstallAction";
import { SkillNameCell } from "@/components/discovery/SkillNameCell";
import { SkillSourceCell } from "@/components/discovery/SkillSourceCell";
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
  const t = useT("find");
  const columns = useMemo(
    (): ColumnDef<SkillSearchResult>[] => [
      {
        key: "name",
        header: t("colName"),
        cellClassName: "min-w-0 flex flex-col gap-1",
        cell: (result) => (
          <SkillNameCell
            ns="find"
            name={result.name}
            pkg={result.package}
            installed={installedPackages.has(result.package)}
          />
        ),
      },
      {
        key: "source",
        header: t("colSource"),
        cellClassName: "min-w-0 flex flex-col gap-1",
        cell: (result) => <SkillSourceCell ns="find" source={result.source} url={result.url} />,
      },
      {
        key: "installs",
        header: t("colInstalls"),
        headerClassName: "text-right",
        cellClassName: "text-right",
        cell: (result) => (
          <span className="font-mono uppercase tracking-label text-micro text-fg-3 flex items-center justify-end gap-1">
            <CloudDownload size={10} />
            {formatInstalls(result.installs) || "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: t("colActions"),
        headerClassName: "text-right",
        cellClassName: "flex justify-end",
        cell: (result) => (
          <SkillInstallAction
            ns="find"
            pkg={result.package}
            installed={installedPackages.has(result.package)}
            installing={installingPackage === result.package}
            busy={installBusy}
            onInstall={onInstall}
          />
        ),
      },
    ],
    [installedPackages, installingPackage, installBusy, onInstall],
  );

  return (
    <Switch>
      <Case condition={showHint}>
        <motion.div {...fadeUp(0.08)} className="border-t border-border py-8">
          <p className="font-body text-sm text-fg-3">{t("hint")}</p>
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
          <span className="font-body text-sm text-fg">{t("empty")}</span>
          <p className="font-body text-sm text-fg-3">{t("emptyHint")}</p>
        </motion.div>
      </Case>

      <Case condition={results.length > 0}>
        <Table columns={columns} rows={results} gridTemplate={FIND_GRID} getRowKey={(r) => r.id} />
      </Case>

      <Default>{null}</Default>
    </Switch>
  );
}
