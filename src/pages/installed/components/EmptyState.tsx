import { Button } from "@zovaris/sephiro/button";
import { EmptyState as UiEmptyState } from "@zovaris/sephiro/empty-state";

import "@zovaris/sephiro/css/empty-state.css";

import { useT } from "@/i18n";
import { useRoute } from "@/lib/routes";

import { clearFilters } from "../store/store";

export function EmptyState() {
  const t = useT("installed");
  const { go } = useRoute();

  return (
    <UiEmptyState
      title={t("empty")}
      description={t("emptyHint")}
      action={
        <Button size="lg" variant="primary" onClick={() => go("find")}>
          {t("install")}
        </Button>
      }
    />
  );
}

export function NoMatches() {
  const t = useT("installed");

  return (
    <UiEmptyState
      compact
      title={t("noMatches")}
      action={
        <Button size="sm" variant="secondary" onClick={clearFilters}>
          {t("clearFilters")}
        </Button>
      }
    />
  );
}
