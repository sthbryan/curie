import { useEffect } from "react";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { refreshAllSummaries } from "@/lib/projects";
import { projectSummaries, projects } from "@/store/projects";
import { PREVIEW_LIMIT } from "../lib/derived";
import { CardHead } from "./CardHead";
import { EmptyNote } from "./EmptyNote";
import { MoreLink } from "./MoreLink";
import { ProjectRow } from "./ProjectRow";

export function ProjectsCard() {
  const t = useT("home");
  const tp = useT("projects");
  const list = projects.value;

  useEffect(() => {
    refreshAllSummaries();
  }, []);

  return (
    <section className="flex flex-col gap-5">
      <CardHead
        title={t("projects")}
        meta={
          <Label className="text-micro">
            {list.length === 1 ? tp("countOne") : tp("count", { count: list.length })}
          </Label>
        }
      />
      {list.length === 0 ? (
        <EmptyNote>{tp("empty")}</EmptyNote>
      ) : (
        <div className="flex flex-col">
          {list.slice(0, PREVIEW_LIMIT).map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              summary={projectSummaries.value[project.id]}
            />
          ))}
          <MoreLink count={list.length - PREVIEW_LIMIT} to="/projects" />
        </div>
      )}
    </section>
  );
}
