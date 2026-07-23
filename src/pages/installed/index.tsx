import { FullPageError } from "@/components/FullPageError";
import { FullPageLoading } from "@/components/FullPageLoading";
import { loadGlobalSkills } from "@/lib/boot";
import { useSkillsStore } from "@/store/skills";
import { useUiStore } from "@/store/ui";
import { InstalledFilters } from "./components/InstalledFilters";
import { InstalledHeader } from "./components/InstalledHeader";
import { InstalledList } from "./components/InstalledList";

export function Installed() {
  const lang = useUiStore((s) => s.lang);
  const skills = useSkillsStore((s) => s.skills);
  const skillsLoading = useSkillsStore((s) => s.skillsLoading);
  const skillsError = useSkillsStore((s) => s.skillsError);
  const loadSkills = () => {
    void loadGlobalSkills();
  };

  if (skillsLoading && skills.length === 0) {
    return <FullPageLoading lang={lang} />;
  }

  if (skillsError && skills.length === 0) {
    return <FullPageError lang={lang} message={skillsError} onRetry={loadSkills} />;
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-10 pt-12 pb-8">
        <InstalledHeader />
        <InstalledFilters />
        <InstalledList />
      </div>
    </main>
  );
}
