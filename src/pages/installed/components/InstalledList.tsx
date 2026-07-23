import { ArrowUp, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Case, Default, Switch } from "react-if";
import { useLocation } from "wouter";
import { ActionProgress } from "@/components/ActionProgress";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconButton } from "@/components/IconButton";
import type { ColumnDef } from "@/components/Table";
import { Table } from "@/components/Table";
import type { SkillInfo } from "@/components/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { fadeUp } from "@/lib/motion";
import { filterSkills, formatRelative, skillTimestamp, updateNameSet } from "@/lib/skills";
import { skills, skillUpdates } from "@/store/skills";
import type { SortField } from "../store/store";
import {
  agentFilter,
  query,
  remove,
  removingSkill,
  setSort,
  sortDir,
  sortKey,
  update,
  updatesOnly,
  updatingSkill,
} from "../store/store";
import { AgentBadge } from "./AgentBadge";

const INSTALLED_GRID = "grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_4.5rem_5rem]";

function sortSkills(
  skills: SkillInfo[],
  updateNames: Set<string>,
  key: SortField,
  dir: "asc" | "desc",
): SkillInfo[] {
  return [...skills].sort((a, b) => {
    const aUp = updateNames.has(a.name) ? -1 : 0;
    const bUp = updateNames.has(b.name) ? -1 : 0;
    if (aUp !== bUp) return aUp - bUp;

    let cmp = 0;
    switch (key) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "source":
        cmp = (a.source ?? "").localeCompare(b.source ?? "");
        break;
      case "agents":
        cmp = a.agents.length - b.agents.length;
        break;
      case "updated": {
        const aTs = skillTimestamp(a);
        const bTs = skillTimestamp(b);
        if (!aTs && !bTs) cmp = 0;
        else if (!aTs) cmp = 1;
        else if (!bTs) cmp = -1;
        else cmp = Date.parse(aTs) - Date.parse(bTs);
        break;
      }
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

export function InstalledList() {
  const t = useT("installed");
  const updateNames = useMemo(() => updateNameSet(skillUpdates.value), [skillUpdates.value]);
  const filtered = useMemo(
    () =>
      filterSkills(skills.value, query.value, agentFilter.value, {
        updatesOnly: updatesOnly.value,
        updateNames,
      }),
    [skills.value, query.value, agentFilter.value, updatesOnly.value, updateNames],
  );
  const sorted = useMemo(
    () => sortSkills(filtered, updateNames, sortKey.value, sortDir.value),
    [filtered, updateNames, sortKey.value, sortDir.value],
  );
  const actionBusy = updatingSkill.value !== null || removingSkill.value !== null;

  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const wasRemoving = useRef(false);

  useEffect(() => {
    if (removingSkill.value) {
      wasRemoving.current = true;
      return;
    }
    if (wasRemoving.current) {
      wasRemoving.current = false;
      setConfirmRemove(null);
    }
  }, [removingSkill.value]);

  const [, navigate] = useLocation();
  const onInstall = () => navigate("/find");
  const onUpdate = (name: string) => {
    update([name]).catch(() => {});
  };
  const onRemove = (name: string) => {
    remove([name]).catch(() => {});
  };

  const listKey = `${agentFilter.value ?? "all"}:${query.value}:${updatesOnly.value ? "up" : "all"}:${sortKey.value}:${sortDir.value}`;

  const columns = useMemo(
    (): ColumnDef<SkillInfo>[] => [
      {
        key: "name",
        header: t("colName"),
        sortable: true,
        cellClassName: "min-w-0 flex flex-col gap-1",
        cell: (skill) => (
          <>
            <span className="font-mono text-mono text-fg truncate">{skill.name}</span>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4 truncate">
              {skill.scope}
            </span>
          </>
        ),
      },
      {
        key: "source",
        header: t("colSource"),
        sortable: true,
        cellClassName: "min-w-0 flex flex-col gap-1",
        cell: (skill) => (
          <>
            <span className="font-mono text-mono text-fg-2 truncate">
              {skill.source ?? t("local")}
            </span>
            <span className="font-mono text-micro text-fg-4 truncate" title={skill.path}>
              {skill.path}
            </span>
          </>
        ),
      },
      {
        key: "agents",
        header: t("colAgents"),
        sortable: true,
        cellClassName: "min-w-0 flex flex-wrap gap-1.5",
        cell: (skill) =>
          skill.agents.length === 0 ? (
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t("noAgents")}
            </span>
          ) : (
            skill.agents.map((agent) => <AgentBadge key={`${skill.name}-${agent}`} label={agent} />)
          ),
      },
      {
        key: "updated",
        header: t("colWhen"),
        sortable: true,
        headerClassName: "text-right",
        cellClassName: "text-right",
        cell: (skill) => {
          const when = skillTimestamp(skill);
          const isUpdate = updateNames.has(skill.name);
          return (
            <span
              className={cn(
                "font-mono uppercase tracking-label text-micro",
                isUpdate ? "text-accent" : "text-fg-4",
              )}
            >
              {when ? formatRelative(when) : "—"}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: t("colActions"),
        headerClassName: "text-right",
        cellClassName: "flex h-7 items-center justify-end gap-1",
        cell: (skill) => {
          const updating = updatingSkill.value === skill.name || updatingSkill.value === "*";
          const removing = removingSkill.value === skill.name || removingSkill.value === "*";
          const isBusy = updating || removing;
          return (
            <>
              {isBusy ? (
                <ActionProgress
                  active
                  labelKey={updating ? "installed.updatingOne" : "installed.removing"}
                />
              ) : (
                <>
                  {updateNames.has(skill.name) ? (
                    <IconButton
                      variant="accent"
                      size="sm"
                      label={t("updateOne")}
                      onClick={() => onUpdate(skill.name)}
                      disabled={actionBusy}
                    >
                      <ArrowUp size={14} />
                    </IconButton>
                  ) : (
                    <span className="inline-block h-7 w-7 shrink-0" aria-hidden />
                  )}
                  <IconButton
                    variant="danger"
                    size="sm"
                    label={t("remove")}
                    onClick={() => setConfirmRemove(skill.name)}
                    disabled={actionBusy}
                  >
                    <X size={13} />
                  </IconButton>
                </>
              )}
            </>
          );
        },
      },
    ],
    [updateNames, actionBusy, onUpdate, onRemove],
  );

  return (
    <section className="flex flex-col">
      <Switch>
        <Case condition={skills.value.length === 0}>
          <motion.div
            {...fadeUp(0.08)}
            className="flex flex-col gap-4 border border-border-strong bg-surface-tint px-5 py-8"
          >
            <span className="font-body text-sm text-fg">{t("empty")}</span>
            <p className="font-body text-sm text-fg-3">{t("emptyHint")}</p>
            <div>
              <Button size="lg" variant="primary" onClick={onInstall}>
                {t("install")}
              </Button>
            </div>
          </motion.div>
        </Case>
        <Case condition={sorted.length === 0}>
          <motion.div {...fadeUp(0.08)} className="border-t border-border py-8">
            <p className="font-body text-sm text-fg-3">{t("noMatches")}</p>
          </motion.div>
        </Case>
        <Default>
          <Table
            columns={columns}
            rows={sorted}
            gridTemplate={INSTALLED_GRID}
            sortKey={sortKey.value}
            sortDir={sortDir.value}
            onSort={(key) => setSort(key as SortField)}
            bodyKey={listKey}
            getRowKey={(skill) => `${skill.name}-${skill.path}`}
          />
        </Default>
      </Switch>

      <ConfirmDialog
        open={confirmRemove !== null}
        title={t("removeTitle")}
        description={t("removeBody")}
        detail={confirmRemove ?? undefined}
        confirmLabel={t("removeConfirm")}
        cancelLabel={t("removeCancel")}
        busy={removingSkill.value !== null}
        busyLabel={t("removing")}
        onCancel={() => {
          if (!removingSkill.value) setConfirmRemove(null);
        }}
        onConfirm={() => {
          if (confirmRemove) onRemove(confirmRemove);
        }}
      />
    </section>
  );
}
