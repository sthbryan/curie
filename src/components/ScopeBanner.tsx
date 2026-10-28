import { Button } from "@zovaris/sephiro/button";
import { Notice } from "@zovaris/sephiro/notice";

import { useT } from "@/i18n";
import { useRoute } from "@/lib/routes";

export function ScopeBanner() {
  const t = useT("scope");
  const { scope, section, go } = useRoute();

  if (scope.kind !== "project") return null;

  return (
    <Notice variant="info">
      <p className="min-w-0 font-mono uppercase tracking-label text-micro text-fg-3">
        {t("installingInto")} <span className="font-bold text-fg">{scope.project.name}</span>
        <span className="ml-2 normal-case tracking-normal text-fg-4" title={scope.project.path}>
          {scope.project.path}
        </span>
      </p>

      <Button size="sm" variant="quiet" className="mt-2" onClick={() => go(section, null)}>
        {t("switchToGlobal")}
      </Button>
    </Notice>
  );
}
