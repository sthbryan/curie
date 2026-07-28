import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { useRoute } from "@/lib/routes";

export function ScopeChip() {
  const t = useT("scope");
  const { scope, go } = useRoute();
  const isProject = scope.kind === "project";

  return (
    <button
      type="button"
      onClick={() => go("projects", null)}
      title={isProject ? scope.project.path : t("globalHint")}
      aria-label={t("manage")}
      className={cn(
        "flex h-5 max-w-48 cursor-pointer items-center gap-1.5 rounded-sm border px-1.5",
        "font-mono uppercase tracking-label text-micro transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-fg",
        isProject
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border text-fg-3 hover:border-border-strong hover:text-fg",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-1.5 w-1.5 shrink-0",
          isProject ? "bg-accent" : "border border-fg-4",
        )}
      />
      <span className="truncate">{isProject ? scope.project.name : t("global")}</span>
    </button>
  );
}
