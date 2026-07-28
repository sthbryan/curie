import { Button } from "@/components/Button";
import { useT } from "@/i18n";
import { useRoute } from "@/lib/routes";
import { clearFilters } from "../store/store";

export function EmptyState() {
  const t = useT("installed");
  const { go } = useRoute();

  return (
    <div className="flex flex-col items-start gap-4 border border-border-strong bg-surface-tint px-5 py-8">
      <span className="font-body text-sm text-fg">{t("empty")}</span>
      <p className="font-body text-sm text-fg-3">{t("emptyHint")}</p>
      <Button size="lg" variant="primary" onClick={() => go("find")}>
        {t("install")}
      </Button>
    </div>
  );
}

export function NoMatches() {
  const t = useT("installed");

  return (
    <div className="flex flex-col items-start gap-4 border-t border-border py-8">
      <p className="font-body text-sm text-fg-3">{t("noMatches")}</p>
      <Button size="sm" variant="outline" onClick={clearFilters}>
        {t("clearFilters")}
      </Button>
    </div>
  );
}
