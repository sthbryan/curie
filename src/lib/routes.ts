import { useLocation } from "wouter";
import type { Project, Scope } from "@/components/types";
import { withViewTransition } from "@/lib/viewTransition";
import { projects } from "@/store/projects";

export const SECTIONS = [
  "home",
  "installed",
  "marketplace",
  "find",
  "custom",
  "projects",
  "settings",
] as const;

export type Section = (typeof SECTIONS)[number];

export const SCOPED_SECTIONS: Section[] = ["installed", "marketplace", "find", "custom"];

const SECTION_PATHS: Record<Section, string> = {
  home: "/",
  installed: "/installed",
  marketplace: "/marketplace",
  find: "/find",
  custom: "/custom",
  projects: "/projects",
  settings: "/settings",
};

const PATH_SECTIONS = new Map<string, Section>(
  SECTIONS.map((section) => [SECTION_PATHS[section], section]),
);

export const GLOBAL_SCOPE: Scope = { kind: "global" };

export function parseLocation(location: string): { scopeId: string | null; section: Section } {
  const scoped = /^\/p\/([^/]+)(\/.*)?$/.exec(location);
  if (!scoped) {
    return { scopeId: null, section: PATH_SECTIONS.get(location) ?? "home" };
  }

  const scopeId = decodeURIComponent(scoped[1]);
  const rest = scoped[2] ?? "";
  const section = PATH_SECTIONS.get(rest) ?? "installed";
  return { scopeId, section: SCOPED_SECTIONS.includes(section) ? section : "installed" };
}

export function sectionPath(scopeId: string | null, section: Section): string {
  if (!scopeId || !SCOPED_SECTIONS.includes(section)) return SECTION_PATHS[section];
  return `/p/${encodeURIComponent(scopeId)}${SECTION_PATHS[section]}`;
}

export function scopeKey(scope: Scope): string {
  return scope.kind === "global" ? "global" : `project:${scope.project.path}`;
}

export function scopePath(scope: Scope): string | null {
  return scope.kind === "global" ? null : scope.project.path;
}

export function findProject(id: string | null): Project | null {
  if (!id) return null;
  return projects.value.find((p) => p.id === id) ?? null;
}

export function useRoute() {
  const [location, navigate] = useLocation();
  const { scopeId, section } = parseLocation(location);
  const project = findProject(scopeId);
  const scope: Scope = project ? { kind: "project", project } : GLOBAL_SCOPE;

  const transition = (path: string) => {
    withViewTransition(() => navigate(path));
  };

  return {
    location,
    navigate: transition,
    section,
    scopeId,
    scope,
    missing: scopeId !== null && project === null,
    go: (next: Section, id: string | null = scopeId) => transition(sectionPath(id, next)),
  };
}

export function useScope(): Scope {
  return useRoute().scope;
}
