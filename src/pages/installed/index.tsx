import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { FullPageError } from "@/components/FullPageError";
import { FullPageLoading } from "@/components/FullPageLoading";
import { loadGlobalSkills } from "@/lib/boot";
import { filterSkills, summarizeAgents, updateNameSet } from "@/lib/skills";
import { useSkillsStore } from "@/store/skills";
import { useUiStore } from "@/store/ui";
import { InstalledFilters } from "./components/InstalledFilters";
import { InstalledHeader } from "./components/InstalledHeader";
import { InstalledList } from "./components/InstalledList";
import { useSkillActions } from "./hooks/useSkillActions";

export function Installed() {
  const lang = useUiStore((s) => s.lang);
  const [, navigate] = useLocation();
  const skills = useSkillsStore((s) => s.skills);
  const skillsLoading = useSkillsStore((s) => s.skillsLoading);
  const skillsError = useSkillsStore((s) => s.skillsError);
  const skillUpdates = useSkillsStore((s) => s.skillUpdates);
  const updatesLoading = useSkillsStore((s) => s.updatesLoading);
  const {
    updatingSkill,
    updateApplyError,
    removingSkill,
    removeError,
    update: runUpdate,
    remove: runRemove,
    dismissErrors,
  } = useSkillActions();

  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const [updatesOnly, setUpdatesOnly] = useState(false);

  const agents = useMemo(() => summarizeAgents(skills), [skills]);
  const updateNames = useMemo(() => updateNameSet(skillUpdates), [skillUpdates]);
  const updateCount = updateNames.size;
  const actionBusy = updatingSkill !== null || removingSkill !== null;
  const filtered = useMemo(
    () =>
      filterSkills(skills, query, agentFilter, {
        updatesOnly,
        updateNames,
      }),
    [skills, query, agentFilter, updatesOnly, updateNames],
  );

  const handleUpdateOne = (name: string) => {
    runUpdate([name]).catch(() => {
      // hook keeps updateApplyError
    });
  };

  const handleUpdateAll = () => {
    const names = [...updateNames];
    runUpdate(names.length > 0 ? names : undefined).catch(() => {
      // hook keeps updateApplyError
    });
  };

  const handleRemoveOne = (name: string) => {
    runRemove([name]).catch(() => {
      // hook keeps removeError
    });
  };

  if (skillsLoading && skills.length === 0) {
    return <FullPageLoading lang={lang} />;
  }

  if (skillsError && skills.length === 0) {
    return (
      <FullPageError
        lang={lang}
        message={skillsError}
        onRetry={() => {
          loadGlobalSkills().catch(() => {
            // store handles error state
          });
        }}
      />
    );
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-10 pt-12 pb-8">
        <InstalledHeader
          lang={lang}
          skillsCount={skills.length}
          updateCount={updateCount}
          actionBusy={actionBusy}
          skillsLoading={skillsLoading}
          updatesLoading={updatesLoading}
          updatingAll={updatingSkill === "*"}
          updateApplyError={updateApplyError}
          removeError={removeError}
          onUpdateAll={handleUpdateAll}
          onRefresh={() => {
            loadGlobalSkills().catch(() => {
              // store handles error state
            });
          }}
          onInstall={() => navigate("/find")}
          onDismissError={dismissErrors}
        />

        <InstalledFilters
          lang={lang}
          query={query}
          onQueryChange={setQuery}
          filteredCount={filtered.length}
          totalCount={skills.length}
          agents={agents}
          agentFilter={agentFilter}
          updatesOnly={updatesOnly}
          updateCount={updateCount}
          onClearFilters={() => {
            setAgentFilter(null);
            setUpdatesOnly(false);
          }}
          onToggleUpdatesOnly={() => {
            setUpdatesOnly((v) => !v);
            setAgentFilter(null);
          }}
          onSelectAgent={(label) => {
            setUpdatesOnly(false);
            setAgentFilter(label === agentFilter ? null : label);
          }}
        />

        <InstalledList
          lang={lang}
          skillsCount={skills.length}
          filtered={filtered}
          updateNames={updateNames}
          updatingSkill={updatingSkill}
          removingSkill={removingSkill}
          actionBusy={actionBusy}
          listKey={`${agentFilter ?? "all"}:${query}:${updatesOnly ? "up" : "all"}`}
          onInstall={() => navigate("/find")}
          onUpdate={handleUpdateOne}
          onRemove={handleRemoveOne}
        />
      </div>
    </main>
  );
}
