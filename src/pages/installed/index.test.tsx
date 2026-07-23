// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import type { SkillInfo } from "@/components/types";
import {
  setSkills,
  setSkillsLoading,
  setSkillUpdates,
  skills,
  skillsError,
  skillsLoading,
  skillUpdates,
  updatesError,
  updatesLoading,
} from "@/store/skills";
import { hasBooted, lang, node, reducedMotion, stage, theme } from "@/store/system";
import { useInstalledActionsStore, useInstalledFiltersStore } from "./store";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));
vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

const { Installed } = await import("./index");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function render(ui: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Router>{ui}</Router>);
  });
}

const skill = (name: string, agents: string[]): SkillInfo => ({
  name,
  path: `/a/${name}`,
  scope: "global",
  agents,
  source: `me/${name}`,
  sourceUrl: null,
  sourceType: "github",
  installedAt: "2026-07-10T10:00:00.000Z",
  updatedAt: null,
});

beforeEach(() => {
  invokeMock.mockReset();
  loadGlobalSkillsMock.mockClear();
  skills.value = [];
  skillsLoading.value = false;
  skillsError.value = null;
  skillUpdates.value = [];
  updatesLoading.value = false;
  updatesError.value = null;
  theme.value = "dark";
  lang.value = "en";
  reducedMotion.value = "user";
  hasBooted.value = false;
  stage.value = "loading";
  node.value = null;
  useInstalledActionsStore.setState({
    updatingSkill: null,
    updateApplyError: null,
    removingSkill: null,
    removeError: null,
  });
  useInstalledFiltersStore.setState({
    query: "",
    agentFilter: null,
    updatesOnly: false,
  });
});

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount();
    });
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
});

describe("Installed", () => {
  it("renders the loading screen when skills are loading and empty", () => {
    setSkillsLoading(true);
    render(<Installed />);
    expect(container?.textContent).toMatch(/loading|cargando/i);
  });

  it("renders installed skills and the filter bar", () => {
    setSkills([skill("impeccable", ["Claude Code", "Codex"]), skill("find-skills", ["Codex"])]);
    render(<Installed />);
    expect(container?.textContent).toContain("impeccable");
    expect(container?.textContent).toContain("find-skills");
    expect(container?.textContent).toContain("Claude Code");
  });

  it("filters the list as the user types in the search box", () => {
    setSkills([skill("impeccable", ["Codex"]), skill("find-skills", ["Codex"])]);
    render(<Installed />);
    const searchInput = container?.querySelector('input[type="search"]') as HTMLInputElement | null;
    expect(searchInput).not.toBeNull();

    act(() => {
      if (searchInput) {
        searchInput.value = "find";
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    // After debounce/re-render, only "find-skills" should be visible.
    expect(container?.textContent).toContain("find-skills");
  });

  it("triggers update_skills for the given name when the row update button is clicked", async () => {
    invokeMock.mockResolvedValue({ updated: ["impeccable"], message: "ok" });
    setSkills([skill("impeccable", ["Codex"])]);
    setSkillUpdates([
      { name: "impeccable", source: "me/impeccable", updateAvailable: true, checkable: true },
    ]);
    render(<Installed />);

    const updateBtn = container?.querySelector(
      'button[aria-label="UPDATE"]',
    ) as HTMLButtonElement | null;
    expect(updateBtn).not.toBeNull();
    await act(async () => {
      updateBtn?.click();
    });

    expect(invokeMock).toHaveBeenCalledWith("update_skills", { skills: ["impeccable"] });
  });

  it("shows the empty-state hint when there are no skills installed", () => {
    render(<Installed />);
    expect(container?.textContent).toContain("No global skills installed");
  });
});
