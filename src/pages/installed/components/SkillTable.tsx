import { Table, type TableColumn, type TableSort } from "@zovaris/sephiro/table";
import { useMemo } from "react";

import "@zovaris/sephiro/css/table.css";

import { TableLabel } from "@/components/TableLabel";
import type { SkillInfo } from "@/components/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { formatRelative, skillTimestamp } from "@/lib/skills";
import { lang } from "@/store/system";

import { ROW_HEIGHT, updateNames, visibleSkills } from "../lib/derived";
import type { SortField } from "../lib/query";
import { removingSkill, sortDir, sortKey, updatingSkill } from "../store/store";
import { AgentCell } from "./AgentCell";
import { RowActions } from "./RowActions";

const FRAME = "min-h-0 max-h-full";

type Props = {
  onAskRemove: (name: string) => void;
};

export function SkillTable({ onAskRemove }: Props) {
  const t = useT("installed");
  const outdated = updateNames.value;
  const busy = updatingSkill.value !== null || removingSkill.value !== null;
  const locale = lang.value;

  const columns = useMemo(
    (): TableColumn<SkillInfo>[] => [
      {
        key: "name",
        label: <TableLabel>{t("colName")}</TableLabel>,
        sortable: true,
        width: "24%",
        render: (skill) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-mono text-mono text-fg">{skill.name}</span>
            <span className="truncate font-mono uppercase tracking-label text-micro text-fg-4">
              {skill.scope}
            </span>
          </div>
        ),
      },
      {
        key: "source",
        label: <TableLabel>{t("colSource")}</TableLabel>,
        sortable: true,
        width: "25%",
        render: (skill) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-mono text-mono text-fg-2">
              {skill.source ?? t("local")}
            </span>
            <span className="truncate font-mono text-micro text-fg-4" title={skill.path}>
              {skill.path}
            </span>
          </div>
        ),
      },
      {
        key: "agents",
        label: <TableLabel>{t("colAgents")}</TableLabel>,
        sortable: true,
        width: "23%",
        render: (skill) => <AgentCell agents={skill.agents} />,
      },
      {
        key: "updated",
        label: <TableLabel>{t("colWhen")}</TableLabel>,
        sortable: true,
        align: "end",
        width: "12%",
        render: (skill) => {
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
        label: <TableLabel>{t("colActions")}</TableLabel>,
        align: "end",
        width: "16%",
        render: (skill) => (
          <div className="flex items-center justify-end gap-1">
            <RowActions
              name={skill.name}
              outdated={outdated.has(skill.name)}
              busy={busy}
              onAskRemove={onAskRemove}
            />
          </div>
        ),
      },
    ],
    [t, outdated, busy, locale, onAskRemove],
  );

  const sort: TableSort[] = [{ key: sortKey.value, direction: sortDir.value }];

  const handleSort = (next: TableSort[]) => {
    const entry = next[0];
    if (!entry) return;
    sortKey.value = entry.key as SortField;
    sortDir.value = entry.direction;
  };

  return (
    <Table
      className={FRAME}
      style={{ tableLayout: "fixed" }}
      columns={columns}
      rows={visibleSkills.value}
      getRowId={(skill) => skill.path}
      manualSort
      sort={sort}
      onSortChange={handleSort}
      stickyHeader
      virtualRowHeight={ROW_HEIGHT}
    />
  );
}
