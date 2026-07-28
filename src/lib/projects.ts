import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import type { Project, ProjectProbe, SkillInfo } from "@/components/types";
import { t } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import {
  clearProjectSummary,
  projects,
  setProjectSummary,
  setProjects,
  setProjectsError,
  setProjectsLoading,
} from "@/store/projects";
import { lang } from "@/store/system";

const tr = (key: string, vars?: Record<string, string | number>) => t(lang.value, key, vars);

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "project";
}

function uniqueId(name: string, taken: Project[]): string {
  const base = slugify(name);
  if (!taken.some((p) => p.id === base)) return base;
  let n = 2;
  while (taken.some((p) => p.id === `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function samePath(a: string, b: string): boolean {
  return a === b || a.toLowerCase() === b.toLowerCase();
}

export function isNested(a: string, b: string): boolean {
  const x = `${a.replace(/\/+$/, "").toLowerCase()}/`;
  const y = `${b.replace(/\/+$/, "").toLowerCase()}/`;
  return x !== y && (x.startsWith(y) || y.startsWith(x));
}

export async function loadProjects() {
  setProjectsLoading(true);
  setProjectsError(null);
  try {
    setProjects(await invoke<Project[]>("read_projects"));
  } catch (e) {
    setProjectsError(errorMessage(e));
  } finally {
    setProjectsLoading(false);
  }
}

async function persist(next: Project[], previous: Project[]): Promise<boolean> {
  setProjects(next);
  try {
    await invoke("write_projects", { projects: next });
    return true;
  } catch (e) {
    setProjects(previous);
    toast.error(tr("projects.saveFailed"), { description: errorMessage(e) });
    return false;
  }
}

export async function addProject(): Promise<Project | null> {
  let picked: string | null = null;
  try {
    const result = await open({
      directory: true,
      multiple: false,
      title: tr("projects.pickTitle"),
    });
    picked = typeof result === "string" ? result : null;
  } catch (e) {
    toast.error(tr("projects.pickFailed"), { description: errorMessage(e) });
    return null;
  }
  if (!picked) return null;

  let probe: ProjectProbe;
  try {
    probe = await invoke<ProjectProbe>("validate_project_path", { path: picked });
  } catch (e) {
    toast.error(tr("projects.invalid"), { description: errorMessage(e) });
    return null;
  }

  if (!probe.exists || !probe.isDir) {
    toast.error(tr("projects.invalid"), { description: probe.path });
    return null;
  }

  if (probe.isReserved) {
    toast.error(tr("projects.refused"), { description: probe.path });
    return null;
  }

  const current = projects.value;
  const existing = current.find((p) => samePath(p.path, probe.path));
  if (existing) {
    toast.info(tr("projects.duplicate", { name: existing.name }));
    return existing;
  }

  const overlapping = current.find((p) => isNested(p.path, probe.path));
  if (overlapping) {
    toast.error(tr("projects.nested", { name: overlapping.name }));
    return null;
  }

  const project: Project = {
    id: uniqueId(probe.name, current),
    name: probe.name,
    path: probe.path,
    addedAt: new Date().toISOString(),
  };

  if (!(await persist([...current, project], current))) return null;

  toast.success(tr("toast.projectAdded", { name: project.name }));
  void refreshProjectSummary(project);
  return project;
}

export async function forgetProject(project: Project): Promise<boolean> {
  const current = projects.value;
  const next = current.filter((p) => p.id !== project.id);
  if (!(await persist(next, current))) return false;

  clearProjectSummary(project.id);
  toast.success(tr("toast.projectForgotten", { name: project.name }));
  return true;
}

export async function refreshProjectSummary(project: Project) {
  try {
    const list = await invoke<SkillInfo[]>("list_skills", { projectPath: project.path });
    const agents = [...new Set(list.flatMap((s) => s.agents))].sort();
    setProjectSummary(project.id, { count: list.length, agents, missing: false, error: null });
  } catch (e) {
    const message = errorMessage(e);
    setProjectSummary(project.id, {
      count: 0,
      agents: [],
      missing: /not found|not a folder/i.test(message),
      error: message,
    });
  }
}

export function refreshAllSummaries() {
  void Promise.allSettled(projects.value.map(refreshProjectSummary));
}
