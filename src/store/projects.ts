import { signal } from "@preact/signals";
import type { Project, ProjectSummary } from "@/components/types";

export const projects = signal<Project[]>([]);
export const projectsLoading = signal<boolean>(false);
export const projectsError = signal<string | null>(null);
export const projectSummaries = signal<Record<string, ProjectSummary>>({});

export const setProjects = (next: Project[]) => {
  projects.value = next;
  projectsError.value = null;
};
export const setProjectsLoading = (next: boolean) => {
  projectsLoading.value = next;
};
export const setProjectsError = (next: string | null) => {
  projectsError.value = next;
};
export const setProjectSummary = (id: string, summary: ProjectSummary) => {
  projectSummaries.value = { ...projectSummaries.value, [id]: summary };
};
export const clearProjectSummary = (id: string) => {
  const { [id]: _removed, ...rest } = projectSummaries.value;
  projectSummaries.value = rest;
};

export const projectsStore = {
  projects,
  projectsLoading,
  projectsError,
  projectSummaries,
  setProjects,
  setProjectsLoading,
  setProjectsError,
  setProjectSummary,
  clearProjectSummary,
};
