import { useMemo } from "react";
import type { ColumnDef } from "@/components/Table";
import { Table } from "@/components/Table";
import type { SkillInfo } from "@/components/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { formatRelative, skillTimestamp } from "@/lib/skills";
import { lang } from "@/store/system";
import { ROW_HEIGHT, updateNames, visibleSkills } from "../lib/derived";
import type { SortField } from "../lib/query";
import { removingSkill, setSort, sortDir, sortKey, updatingSkill } from "../store/store";
import { AgentCell } from "./AgentCell";
import { RowActions } from "./RowActions";

const GRID = "grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_5rem_5rem]";

type Props = {
  onAskRemove: (name: string) => void;
};

export function SkillTable({ onAskRemove }: Props) {
  const t = useT("installed");
  const outdated = updateNames.value;
  const busy = updatingSkill.value !== null || removingSkill.value !== null;
  const locale = lang.value;

  const columns = useMemo(
    (): ColumnDef<SkillInfo>[] => [
      {
        key: "name",
        header: t("colName"),
        sortable: true,
        cellClassName: "flex min-w-0 flex-col gap-1",
        cell: (skill) => (
          <>
            <span className="truncate font-mono text-mono text-fg">{skill.name}</span>
            <span className="truncate font-mono uppercase tracking-label text-micro text-fg-4">
              {skill.scope}
            </span>
          </>
        ),
      },
      {
        key: "source",
        header: t("colSource"),
        sortable: true,
        cellClassName: "flex min-w-0 flex-col gap-1",
        cell: (skill) => (
          <>
            <span className="truncate font-mono text-mono text-fg-2">
              {skill.source ?? t("local")}
            </span>
            <span className="truncate font-mono text-micro text-fg-4" title={skill.path}>
              {skill.path}
            </span>
          </>
        ),
      },
      {
        key: "agents",
        header: t("colAgents"),
        sortable: true,
        cellClassName: "min-w-0",
        cell: (skill) => <AgentCell agents={skill.agents} />,
      },
      {
        key: "updated",
        header: t("colWhen"),
        sortable: true,
        headerClassName: "text-right",
        cellClassName: "text-right",
        cell: (skill) => {
          const when = skillTimestamp(skill);
          return (
            <span
              className={cn(
                "font-mono uppercase tracking-label text-micro whitespace-nowrap",
                outdated.has(skill.name) ? "text-accent" : "text-fg-4",
              )}
            >
              {when ? formatRelative(when, Date.now(), locale) : "—"}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: t("colActions"),
        headerClassName: "text-right",
        cellClassName: "flex items-center justify-end gap-1",
        cell: (skill) => (
          <RowActions
            name={skill.name}
            outdated={outdated.has(skill.name)}
            busy={busy}
            onAskRemove={onAskRemove}
          />
        ),
      },
    ],
    [t, outdated, busy, locale, onAskRemove],
  );

  return (
    <Table
      columns={columns}
      rows={visibleSkills.value}
      gridTemplate={GRID}
      rowHeight={ROW_HEIGHT}
      sortKey={sortKey.value}
      sortDir={sortDir.value}
      onSort={(key) => setSort(key as SortField)}
      getRowKey={(skill) => skill.path}
      viewportClassName="pr-1"
    />
  );
}
