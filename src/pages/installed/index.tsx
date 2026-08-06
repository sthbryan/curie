import { useState } from "react";
import { FullPageError } from "@/components/FullPageError";
import { FullPageLoading } from "@/components/FullPageLoading";
import { loadSkills } from "@/lib/boot";
import { fadeUp } from "@/lib/motion";
import { skills, skillsError, skillsLoading } from "@/store/skills";
import { EmptyState, NoMatches } from "./components/EmptyState";
import { ErrorBanner } from "./components/ErrorBanner";
import { InstalledHeader } from "./components/InstalledHeader";
import { InstalledToolbar } from "./components/InstalledToolbar";
import { RemoveAllDialog } from "./components/RemoveAllDialog";
import { RemoveSkillDialog } from "./components/RemoveSkillDialog";
import { SkillTable } from "./components/SkillTable";
import { visibleSkills } from "./lib/derived";

export function Installed() {
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);

  if (skillsLoading.value && skills.value.length === 0) {
    return <FullPageLoading />;
  }

  if (skillsError.value && skills.value.length === 0) {
    return (
      <FullPageError
        message={skillsError.value}
        onRetry={() => {
          void loadSkills();
        }}
      />
    );
  }

  const empty = skills.value.length === 0;

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-6 px-10 pt-12 pb-8">
        <div {...fadeUp(0)} className="flex shrink-0 flex-col gap-6">
          <InstalledHeader onAskRemoveAll={() => setRemovingAll(true)} />
          <ErrorBanner />
          {empty ? null : <InstalledToolbar />}
        </div>

        {empty ? (
          <EmptyState />
        ) : visibleSkills.value.length === 0 ? (
          <NoMatches />
        ) : (
          <SkillTable onAskRemove={setPendingRemove} />
        )}
      </div>

      <RemoveSkillDialog name={pendingRemove} onClose={() => setPendingRemove(null)} />
      <RemoveAllDialog open={removingAll} onClose={() => setRemovingAll(false)} />
    </main>
  );
}
