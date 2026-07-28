import { useT } from "@/i18n";
import { useRoute } from "@/lib/routes";
import { skills, skillsLoading } from "@/store/skills";

export function ScopeAnnouncer() {
  const t = useT("scope");
  const { scope } = useRoute();
  const count = skillsLoading.value ? "…" : skills.value.length;

  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {scope.kind === "project"
        ? t("announceProject", { name: scope.project.name, count })
        : t("announceGlobal", { count })}
    </p>
  );
}
