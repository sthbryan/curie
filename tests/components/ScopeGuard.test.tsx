// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ScopeGuard } from "@/components/ScopeGuard";
import { projects } from "@/store/projects";
import { lang } from "@/store/system";
import { buttonWith, cleanup, click, mount, projectFixture, text } from "../pages/projects/mount";

const donCamaron = projectFixture("don_camaron");

beforeEach(() => {
  lang.value = "en";
  projects.value = [];
  window.history.pushState({}, "", "/");
});

afterEach(cleanup);

describe("ScopeGuard", () => {
  it("renders the page in global scope", () => {
    const el = mount(
      <ScopeGuard>
        <p>skills</p>
      </ScopeGuard>,
    );
    expect(text(el)).toContain("skills");
  });

  it("renders the page for a registered project", () => {
    projects.value = [donCamaron];
    window.history.pushState({}, "", "/p/don_camaron/installed");
    const el = mount(
      <ScopeGuard>
        <p>skills</p>
      </ScopeGuard>,
    );
    expect(text(el)).toContain("skills");
  });

  it("refuses a project that is not registered", () => {
    window.history.pushState({}, "", "/p/ghost/installed");
    const el = mount(
      <ScopeGuard>
        <p>skills</p>
      </ScopeGuard>,
    );

    expect(text(el)).not.toContain("skills");
    expect(text(el)).toContain("PROJECT NOT FOUND");
    expect(text(el)).toContain("ghost");
  });

  it("offers a way back to the projects page", () => {
    window.history.pushState({}, "", "/p/ghost/installed");
    const el = mount(
      <ScopeGuard>
        <p>skills</p>
      </ScopeGuard>,
    );

    click(buttonWith(el, "BACK TO PROJECTS"));
    expect(window.location.pathname).toBe("/projects");
  });
});
