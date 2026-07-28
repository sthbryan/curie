// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ScopeChip } from "@/components/ScopeChip";
import { projects } from "@/store/projects";
import { lang } from "@/store/system";
import { cleanup, click, mount, projectFixture, text } from "../pages/projects/mount";

const donCamaron = projectFixture("don_camaron");

beforeEach(() => {
  lang.value = "en";
  projects.value = [];
  window.history.pushState({}, "", "/");
});

afterEach(cleanup);

describe("ScopeChip", () => {
  it("reads GLOBAL when no project is scoped", () => {
    const el = mount(<ScopeChip />);
    expect(text(el)).toContain("GLOBAL");
  });

  it("stays quiet in global scope", () => {
    const el = mount(<ScopeChip />);
    expect(el.querySelector("button")?.className).not.toContain("accent");
  });

  it("names the project and shouts when one is scoped", () => {
    projects.value = [donCamaron];
    window.history.pushState({}, "", "/p/don_camaron/installed");
    const el = mount(<ScopeChip />);

    expect(text(el)).toContain("don_camaron");
    expect(el.querySelector("button")?.className).toContain("text-accent");
  });

  it("exposes the project path for a hover", () => {
    projects.value = [donCamaron];
    window.history.pushState({}, "", "/p/don_camaron/find");
    const el = mount(<ScopeChip />);

    expect(el.querySelector("button")?.title).toBe("/code/don_camaron");
  });

  it("falls back to GLOBAL when the id is not registered", () => {
    window.history.pushState({}, "", "/p/ghost/installed");
    const el = mount(<ScopeChip />);
    expect(text(el)).toContain("GLOBAL");
  });

  it("goes to the projects page when clicked", () => {
    const el = mount(<ScopeChip />);
    click(el.querySelector("button"));
    expect(window.location.pathname).toBe("/projects");
  });
});
