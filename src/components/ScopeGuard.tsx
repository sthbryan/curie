import type { ComponentChildren } from "preact";
import { useEffect } from "react";
import { FullPageError } from "@/components/FullPageError";
import { useT } from "@/i18n";
import { loadSkills } from "@/lib/boot";
import { scopeKey, scopePath, useRoute } from "@/lib/routes";
import { activeScopePath, resetSkillsForScope, skillsScope } from "@/store/skills";

export function useScopeSync() {
  const { scope, missing } = useRoute();
  const key = missing ? null : scopeKey(scope);
  const path = scopePath(scope);

  useEffect(() => {
    if (key === null) return;
    activeScopePath.value = path;
    if (key === skillsScope.value) return;
    resetSkillsForScope(key);
    void loadSkills(path, { checkUpdates: true });
  }, [key, path]);
}

export function ScopeGuard({ children }: { children: ComponentChildren }) {
  const t = useT("projects");
  const { missing, scopeId, go } = useRoute();

  if (!missing) return <>{children}</>;

  return (
    <FullPageError
      title={t("unknownTitle")}
      message={t("unknownBody", { id: scopeId ?? "" })}
      actionLabel={t("backToProjects")}
      onRetry={() => go("projects", null)}
    />
  );
}
