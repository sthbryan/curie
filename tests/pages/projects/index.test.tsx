// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buttonLabelled,
  buttonWith,
  cleanup,
  click,
  mount,
  projectFixture,
  summaryFixture,
  text,
} from "./mount";

const addProjectMock = vi.fn();
const forgetProjectMock = vi.fn();
const refreshAllSummariesMock = vi.fn();

vi.mock("@/lib/projects", () => ({
  addProject: (...args: unknown[]) => addProjectMock(...args),
  forgetProject: (...args: unknown[]) => forgetProjectMock(...args),
  refreshAllSummaries: (...args: unknown[]) => refreshAllSummariesMock(...args),
}));

const { Projects } = await import("@/pages/projects");
const { projects, projectSummaries } = await import("@/store/projects");
const { skills } = await import("@/store/skills");
const { lang } = await import("@/store/system");

const donCamaron = projectFixture("don_camaron");
const miTaquito = projectFixture("mi_taquito");

beforeEach(() => {
  lang.value = "en";
  projects.value = [];
  projectSummaries.value = {};
  skills.value = [];
  addProjectMock.mockReset().mockResolvedValue(null);
  forgetProjectMock.mockReset().mockResolvedValue(true);
  refreshAllSummariesMock.mockReset();
  window.history.pushState({}, "", "/projects");
});

afterEach(cleanup);

describe("Projects", () => {
  it("always shows the global card first", () => {
    projects.value = [donCamaron];
    const el = mount(<Projects />);
    const headings = Array.from(el.querySelectorAll("span")).map((s) => s.textContent);
    expect(headings.indexOf("GLOBAL")).toBeGreaterThanOrEqual(0);
    expect(headings.indexOf("GLOBAL")).toBeLessThan(headings.indexOf("don_camaron"));
  });

  it("marks global as active while no project is scoped", () => {
    const el = mount(<Projects />);
    expect(text(el)).toContain("ACTIVE");
  });

  it("explains itself when the registry is empty", () => {
    const el = mount(<Projects />);
    expect(text(el)).toContain("No projects yet");
  });

  it("renders a card per project", () => {
    projects.value = [donCamaron, miTaquito];
    const el = mount(<Projects />);
    expect(text(el)).toContain("don_camaron");
    expect(text(el)).toContain("mi_taquito");
    expect(text(el)).toContain("/code/don_camaron");
  });

  it("shows the skill count once the summary arrives", () => {
    projects.value = [donCamaron];
    projectSummaries.value = { don_camaron: summaryFixture({ count: 3, agents: ["Codex"] }) };
    const el = mount(<Projects />);
    expect(text(el)).toContain("3");
    expect(text(el)).toContain("Codex");
  });

  it("loads the summaries when it mounts", () => {
    projects.value = [donCamaron];
    mount(<Projects />);
    expect(refreshAllSummariesMock).toHaveBeenCalled();
  });

  it("enters the project when its card is clicked", () => {
    projects.value = [donCamaron];
    const el = mount(<Projects />);
    click(buttonLabelled(el, "Open don_camaron"));
    expect(window.location.pathname).toBe("/p/don_camaron/installed");
  });

  it("marks the scoped project as active and refuses to open a missing one", () => {
    projects.value = [donCamaron];
    projectSummaries.value = { don_camaron: summaryFixture({ missing: true }) };
    const el = mount(<Projects />);

    expect(text(el)).toContain("MISSING");
    expect(buttonLabelled(el, "Open don_camaron")?.disabled).toBe(true);
  });

  it("adds a project through the picker and enters it", async () => {
    addProjectMock.mockResolvedValue(donCamaron);
    const el = mount(<Projects />);

    const add = buttonWith(el, "ADD PROJECT");
    await click(add);
    await Promise.resolve();
    await Promise.resolve();

    expect(addProjectMock).toHaveBeenCalled();
  });

  it("confirms before forgetting, then forgets", async () => {
    projects.value = [donCamaron];
    const el = mount(<Projects />);

    click(buttonLabelled(el, "Forget don_camaron"));
    expect(document.body.textContent).toContain("Forget project");
    expect(document.body.textContent).toContain("stay exactly where they are on disk");

    const dialog = document.querySelector<HTMLElement>('[role="alertdialog"]');
    click(buttonWith(dialog as HTMLElement, "FORGET"));
    await Promise.resolve();

    expect(forgetProjectMock).toHaveBeenCalledWith(donCamaron);
  });

  it("forgets nothing when the dialog is cancelled", () => {
    projects.value = [donCamaron];
    const el = mount(<Projects />);

    click(buttonLabelled(el, "Forget don_camaron"));
    const dialog = document.querySelector<HTMLElement>('[role="alertdialog"]');
    click(buttonWith(dialog as HTMLElement, "CANCEL"));

    expect(forgetProjectMock).not.toHaveBeenCalled();
  });
});
