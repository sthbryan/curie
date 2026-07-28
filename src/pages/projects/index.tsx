import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Label } from "@/components/Label";
import type { Project } from "@/components/types";
import { useT } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { addProject, forgetProject, refreshAllSummaries } from "@/lib/projects";
import { useRoute } from "@/lib/routes";
import { projectSummaries, projects, projectsError, setProjectsError } from "@/store/projects";
import { skills } from "@/store/skills";
import { AddProjectCell } from "./components/AddProjectCell";
import { ForgetProjectDialog } from "./components/ForgetProjectDialog";
import { GlobalCard } from "./components/GlobalCard";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectsHeader } from "./components/ProjectsHeader";

export function Projects() {
  const t = useT("projects");
  const { scope, go } = useRoute();
  const [adding, setAdding] = useState(false);
  const [pendingForget, setPendingForget] = useState<Project | null>(null);
  const [forgetting, setForgetting] = useState(false);

  const list = projects.value;

  useEffect(() => {
    refreshAllSummaries();
  }, []);

  const handleAdd = async () => {
    setAdding(true);
    const added = await addProject();
    setAdding(false);
    if (added) go("installed", added.id);
  };

  const handleForget = async () => {
    if (!pendingForget) return;
    setForgetting(true);
    if (scope.kind === "project" && scope.project.id === pendingForget.id) {
      go("projects", null);
    }
    await forgetProject(pendingForget);
    setForgetting(false);
    setPendingForget(null);
  };

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-10 pt-12 pb-8">
        <motion.div className="flex flex-col gap-6" {...fadeUp(0)}>
          <ProjectsHeader busy={adding} onAdd={handleAdd} />

          {projectsError.value ? (
            <ErrorNotice
              title={t("summaryError")}
              message={projectsError.value}
              onDismiss={() => setProjectsError(null)}
            />
          ) : null}
        </motion.div>

        <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2" {...fadeUp(0.05)}>
          <GlobalCard
            active={scope.kind === "global"}
            count={scope.kind === "global" ? skills.value.length : 0}
            onOpen={() => go("installed", null)}
          />

          {list.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              summary={projectSummaries.value[project.id]}
              active={scope.kind === "project" && scope.project.id === project.id}
              onOpen={() => go("installed", project.id)}
              onForget={() => setPendingForget(project)}
            />
          ))}

          <AddProjectCell busy={adding} onAdd={handleAdd} />
        </motion.div>

        {list.length === 0 ? (
          <motion.div
            className="flex flex-col gap-2 border border-border-strong bg-surface-tint px-5 py-8"
            {...fadeUp(0.1)}
          >
            <Label>projects.empty</Label>
            <p className="font-body text-sm text-fg-3">{t("emptyHint")}</p>
          </motion.div>
        ) : null}
      </div>

      <ForgetProjectDialog
        project={pendingForget}
        busy={forgetting}
        onConfirm={handleForget}
        onCancel={() => setPendingForget(null)}
      />
    </main>
  );
}
