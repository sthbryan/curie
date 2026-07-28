import { FolderGit2 } from "lucide-react";
import type { Project, ProjectSummary } from "@/components/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { useRoute } from "@/lib/routes";

type Props = {
  project: Project;
  summary: ProjectSummary | undefined;
};

export function ProjectRow({ project, summary }: Props) {
  const t = useT("projects");
  const { go } = useRoute();
  const missing = summary?.missing ?? false;

  return (
    <button
      type="button"
      onClick={() => go("installed", project.id)}
      disabled={missing}
      className="flex items-center gap-3 border-b border-border py-2.5 text-left transition-colors first:border-t hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FolderGit2 size={12} strokeWidth={2} className="shrink-0 text-fg-4" aria-hidden />
      <span className="grow truncate font-mono text-mono text-fg">{project.name}</span>
      <span
        className={cn(
          "shrink-0 whitespace-nowrap font-mono uppercase tracking-label text-micro",
          missing ? "text-warning" : "text-fg-4",
        )}
      >
        {missing ? t("missing") : `${summary?.count ?? "—"} ${t("skills")}`}
      </span>
    </button>
  );
}
