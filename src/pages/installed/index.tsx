import { FullPageError } from "@/components/FullPageError";
import { FullPageLoading } from "@/components/FullPageLoading";
import { loadGlobalSkills } from "@/lib/boot";
import { skills, skillsError, skillsLoading } from "@/store/skills";
import { InstalledFilters } from "./components/InstalledFilters";
import { InstalledHeader } from "./components/InstalledHeader";
import { InstalledList } from "./components/InstalledList";

export function Installed() {
  const loadSkills = () => {
    void loadGlobalSkills();
  };

  if (skillsLoading.value && skills.value.length === 0) {
    return <FullPageLoading />;
  }

  if (skillsError.value && skills.value.length === 0) {
    return <FullPageError message={skillsError.value} onRetry={loadSkills} />;
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
