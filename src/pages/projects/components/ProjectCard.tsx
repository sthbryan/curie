import { AlertTriangle, X } from "lucide-react";
import { AgentBadge } from "@/components/AgentBadge";
import { IconButton } from "@/components/IconButton";
import { Bone } from "@/components/Table/Bone";
import type { Project, ProjectSummary } from "@/components/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";

const MAX_AGENTS = 3;

type Props = {
  project: Project;
  summary: ProjectSummary | undefined;
  active: boolean;
  onOpen: () => void;
  onForget: () => void;
};

export function ProjectCard({ project, summary, active, onOpen, onForget }: Props) {
  const t = useT("projects");
  const missing = summary?.missing ?? false;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 border bg-surface p-5 transition-colors duration-150",
        "focus-within:border-fg-3",
        missing && "border-warning/40",
        !missing && active && "border-fg-3 bg-surface-tint",
        !missing && !active && "border-border hover:border-border-strong hover:bg-surface-hover",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={missing}
        aria-label={t("open", { name: project.name })}
        className="absolute inset-0 z-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-fg disabled:cursor-not-allowed"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-1.5 truncate font-mono font-bold uppercase tracking-label text-mono text-fg">
            {missing ? (
              <AlertTriangle size={11} className="shrink-0 text-warning" aria-hidden />
            ) : null}
            {project.name}
          </span>
          <span
            title={project.path}
            className={cn(
              "truncate font-mono text-micro text-fg-4",
              missing && "line-through decoration-fg-4/60",
            )}
          >
            {project.path}
          </span>
        </div>
        {active && !missing ? (
          <span className="shrink-0 font-mono uppercase tracking-label text-micro text-fg-3">
            {t("active")}
          </span>
        ) : null}
      </div>

      {missing ? (
        <p className="font-body text-sm text-warning">{t("missingHint")}</p>
      ) : summary ? (
        <>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "font-mono text-xl font-bold leading-none tabular-nums",
                summary.count > 0 ? "text-fg" : "text-fg-4",
              )}
            >
              {summary.count}
            </span>
            <span className="font-mono uppercase tracking-label text-micro text-fg-3">
              {t("skills")}
            </span>
          </div>

          <div className="flex min-h-5 flex-wrap gap-1">
            {summary.agents.slice(0, MAX_AGENTS).map((agent) => (
              <AgentBadge key={agent} label={agent} />
            ))}
            {summary.agents.length > MAX_AGENTS ? (
              <span className="self-center px-1 font-mono text-micro text-fg-4">
                +{summary.agents.length - MAX_AGENTS}
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <Bone className="h-6 w-16" />
          <Bone className="h-5 w-32" />
        </>
      )}

      <div className="flex items-center justify-end border-t border-border pt-3">
        <div className="relative z-10 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          <IconButton
            label={t("forget", { name: project.name })}
            variant="ghost"
            onClick={onForget}
          >
            <X size={12} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
