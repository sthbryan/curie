// @vitest-environment happy-dom

import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  agentFilter,
  query,
  queryInput,
  removeError,
  removingSkill,
  sortDir,
  sortKey,
  updateApplyError,
  updatesOnly,
  updatingSkill,
} from "@/pages/installed/store/store";
import { skills, skillsError, skillsLoading, skillUpdates, updatesLoading } from "@/store/skills";
import { lang } from "@/store/system";
import { buttonWith, cleanup, click, mount, skillFixture, text } from "./mount";

const invokeMock = vi.fn();
const loadSkillsMock = vi.fn().mockResolvedValue(undefined);
const checkSkillUpdatesMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));
vi.mock("@/lib/boot", () => ({
  loadSkills: (...args: unknown[]) => loadSkillsMock(...args),
  checkSkillUpdates: (...args: unknown[]) => checkSkillUpdatesMock(...args),
}));

const { Installed } = await import("@/pages/installed/index");

afterEach(cleanup);
beforeEach(() => {
  invokeMock.mockReset();
  loadSkillsMock.mockClear();
  checkSkillUpdatesMock.mockClear();
  lang.value = "en";
  skills.value = [];
  skillsLoading.value = false;
  skillsError.value = null;
  skillUpdates.value = [];
  updatesLoading.value = false;
  updatingSkill.value = null;
  updateApplyError.value = null;
  removingSkill.value = null;
  removeError.value = null;
  queryInput.value = "";
  query.value = "";
  agentFilter.value = null;
  updatesOnly.value = false;
  sortKey.value = "name";
  sortDir.value = "asc";
});

const outdated = (name: string) => ({
  name,
  source: `me/${name}`,
  updateAvailable: true,
  checkable: true,
});

describe("Installed", () => {
  it("shows the loading screen while the first load runs", () => {
    skillsLoading.value = true;
    expect(text(mount(<Installed />))).toMatch(/loading|cargando/i);
  });

  it("shows the error screen when the first load fails", () => {
    skillsError.value = "boom";
    expect(text(mount(<Installed />))).toContain("boom");
  });

  it("invites the user to install when nothing is there", () => {
    const el = mount(<Installed />);
    expect(text(el)).toContain("No global skills installed");
    expect(el.querySelector("input[type=search]")).toBeNull();
    expect(buttonWith(el, "REMOVE ALL")).toBeUndefined();
  });

  it("lists the skills with the toolbar above them", () => {
    skills.value = [skillFixture("impeccable", ["Claude Code", "Codex"]), skillFixture("find")];
    const el = mount(<Installed />);
    expect(text(el)).toContain("impeccable");
    expect(text(el)).toContain("find");
    expect(el.querySelector("input[type=search]")).not.toBeNull();
  });

  it("offers to clear the filters when nothing matches", () => {
    skills.value = [skillFixture("impeccable")];
    query.value = "nothing-like-this";
    const el = mount(<Installed />);
    expect(text(el)).toContain("No skills match");
    click(buttonWith(el, "CLEAR"));
    expect(query.value).toBe("");
  });

  it("updates a single row through the store", async () => {
    invokeMock.mockResolvedValue({ updated: ["impeccable"], message: "ok" });
    skills.value = [skillFixture("impeccable")];
    skillUpdates.value = [outdated("impeccable")];

    const el = mount(<Installed />);
    const updateBtn = el.querySelector<HTMLButtonElement>('button[aria-label="UPDATE"]');
    await act(async () => {
      updateBtn?.click();
    });

    expect(invokeMock).toHaveBeenCalledWith("update_skills", { skills: ["impeccable"], projectPath: null });
  });

  it("confirms before removing one skill", async () => {
    invokeMock.mockResolvedValue({ removed: ["impeccable"], message: "ok" });
    skills.value = [skillFixture("impeccable")];

    const el = mount(<Installed />);
    click(el.querySelector('button[aria-label="REMOVE"]'));

    const dialog = document.body.querySelector("[role=alertdialog]");
    expect(dialog?.textContent).toContain("impeccable");
    expect(invokeMock).not.toHaveBeenCalled();

    await act(async () => {
      Array.from(document.body.querySelectorAll("button"))
        .find((b) => b.textContent === "REMOVE")
        ?.click();
    });
    expect(invokeMock).toHaveBeenCalledWith("remove_skills", { skills: ["impeccable"], projectPath: null });
  });

  it("locks the remove-all confirmation behind the typed phrase", async () => {
    invokeMock.mockResolvedValue({ removed: [], message: "gone" });
    skills.value = [skillFixture("a"), skillFixture("b")];

    const el = mount(<Installed />);
    click(buttonWith(el, "REMOVE ALL"));

    const dialog = document.body.querySelector("[role=alertdialog]");
    expect(dialog?.textContent).toContain("There is no undo");
    const confirm = Array.from(dialog?.querySelectorAll("button") ?? []).find(
      (b) => b.textContent === "REMOVE ALL",
    );
    expect(confirm?.hasAttribute("disabled")).toBe(true);

    const input = dialog?.querySelector<HTMLInputElement>("input");
    act(() => {
      if (input) {
        input.value = "REMOVE";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    expect(confirm?.hasAttribute("disabled")).toBe(false);

    await act(async () => {
      confirm?.click();
    });
    expect(invokeMock).toHaveBeenCalledWith("remove_all_skills", { projectPath: null });
  });

  it("surfaces a failed action in the banner", () => {
    skills.value = [skillFixture("impeccable")];
    removeError.value = "could not remove";
    expect(text(mount(<Installed />))).toContain("could not remove");
  });

  it("refreshes without asking the backend for updates twice", async () => {
    skills.value = [skillFixture("impeccable")];
    const el = mount(<Installed />);

    await act(async () => {
      buttonWith(el, "REFRESH")?.click();
    });

    expect(loadSkillsMock).toHaveBeenCalledWith(null, { checkUpdates: false });
    expect(checkSkillUpdatesMock).toHaveBeenCalledTimes(1);
  });
});
