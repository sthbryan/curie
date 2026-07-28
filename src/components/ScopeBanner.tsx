import { Button } from "@/components/Button";
import { useT } from "@/i18n";
import { useRoute } from "@/lib/routes";

export function ScopeBanner() {
  const t = useT("scope");
  const { scope, section, go } = useRoute();

  if (scope.kind !== "project") return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 border border-border border-l-2 border-l-accent bg-surface-tint px-3 py-2"
    >
      <p className="min-w-0 font-mono uppercase tracking-label text-micro text-fg-3">
        {t("installingInto")} <span className="font-bold text-fg">{scope.project.name}</span>
        <span className="ml-2 normal-case tracking-normal text-fg-4" title={scope.project.path}>
          {scope.project.path}
        </span>
      </p>

      <Button size="xs" variant="ghost" onClick={() => go(section, null)}>
        {t("switchToGlobal")}
      </Button>
    </div>
  );
}
