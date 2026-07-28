import { beforeEach, describe, expect, it } from "vitest";
import type { Project } from "@/components/types";
import { findProject, parseLocation, scopeKey, scopePath, sectionPath } from "@/lib/routes";
import { projects } from "@/store/projects";

const donCamaron: Project = {
  id: "don_camaron",
  name: "don_camaron",
  path: "/code/don_camaron",
  addedAt: "2026-07-27T00:00:00.000Z",
};

beforeEach(() => {
  projects.value = [];
});

describe("parseLocation", () => {
  it("reads the global sections", () => {
    expect(parseLocation("/")).toEqual({ scopeId: null, section: "home" });
    expect(parseLocation("/installed")).toEqual({ scopeId: null, section: "installed" });
    expect(parseLocation("/projects")).toEqual({ scopeId: null, section: "projects" });
    expect(parseLocation("/settings")).toEqual({ scopeId: null, section: "settings" });
  });

  it("reads a scoped section", () => {
    expect(parseLocation("/p/don_camaron/find")).toEqual({
      scopeId: "don_camaron",
      section: "find",
    });
  });

  it("defaults a bare project route to its skills", () => {
    expect(parseLocation("/p/don_camaron")).toEqual({
      scopeId: "don_camaron",
      section: "installed",
    });
  });

  it("refuses to scope a section that has no project flavour", () => {
    expect(parseLocation("/p/don_camaron/settings")).toEqual({
      scopeId: "don_camaron",
      section: "installed",
    });
  });

  it("decodes an id that needed escaping", () => {
    expect(parseLocation("/p/mi%20taquito/find").scopeId).toBe("mi taquito");
  });

  it("falls back to home for an unknown path", () => {
    expect(parseLocation("/nope")).toEqual({ scopeId: null, section: "home" });
  });
});

describe("sectionPath", () => {
  it("builds the global paths", () => {
    expect(sectionPath(null, "home")).toBe("/");
    expect(sectionPath(null, "installed")).toBe("/installed");
  });

  it("builds the scoped paths", () => {
    expect(sectionPath("don_camaron", "installed")).toBe("/p/don_camaron/installed");
    expect(sectionPath("don_camaron", "find")).toBe("/p/don_camaron/find");
  });

  it("keeps the unscopable sections global even inside a project", () => {
    expect(sectionPath("don_camaron", "settings")).toBe("/settings");
    expect(sectionPath("don_camaron", "projects")).toBe("/projects");
    expect(sectionPath("don_camaron", "home")).toBe("/");
  });

  it("round-trips an id that needed escaping", () => {
    const path = sectionPath("mi taquito", "find");
    expect(parseLocation(path).scopeId).toBe("mi taquito");
  });
});

describe("scope helpers", () => {
  it("keys and paths the global scope", () => {
    expect(scopeKey({ kind: "global" })).toBe("global");
    expect(scopePath({ kind: "global" })).toBeNull();
  });

  it("keys and paths a project scope", () => {
    const scope = { kind: "project", project: donCamaron } as const;
    expect(scopeKey(scope)).toBe("project:/code/don_camaron");
    expect(scopePath(scope)).toBe("/code/don_camaron");
  });

  it("resolves an id against the registry", () => {
    projects.value = [donCamaron];
    expect(findProject("don_camaron")).toEqual(donCamaron);
    expect(findProject("ghost")).toBeNull();
    expect(findProject(null)).toBeNull();
  });
});
