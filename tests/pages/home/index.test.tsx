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

const loadGlobalSkillsMock = vi.fn().mockResolvedValue(undefined);
const checkSkillUpdatesMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
  checkSkillUpdates: (...args: unknown[]) => checkSkillUpdatesMock(...args),
}));

const { Home } = await import("@/pages/home/index");

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
  loadGlobalSkillsMock.mockClear();
  checkSkillUpdatesMock.mockClear();
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

describe("Home", () => {
  it("renders the loading screen when skillsLoading and store is empty", () => {
    setSkillsLoading(true);
    render(<Home />);
    expect(container?.textContent).toMatch(/loading|cargando/i);
  });

  it("renders the full page when skills are loaded", () => {
    setSkills([skill("impeccable", ["Claude Code", "Codex"]), skill("find-skills", ["Codex"])]);
    setSkillUpdates([
      {
        name: "impeccable",
        source: "me/impeccable",
        updateAvailable: true,
        checkable: true,
      },
    ]);
    render(<Home />);
    expect(container?.textContent).toContain("HOME · SKILLS");
    expect(container?.textContent).toContain("impeccable");
    expect(container?.textContent).toContain("Codex");
    expect(container?.textContent).toContain("find-skills");
  });

  it("renders the empty-state copy when there are no skills", () => {
    render(<Home />);
    expect(container?.textContent).toContain("No global skills installed yet");
    expect(container?.textContent).toContain("INSTALL A SKILL");
  });

  it("triggers checkSkillUpdates when the 'check' button is clicked", async () => {
    setSkills([skill("impeccable", ["Codex"])]);
    render(<Home />);

    const checkBtn = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.toLowerCase().includes("check"),
    );
    expect(checkBtn).toBeDefined();
    await act(async () => {
      checkBtn?.click();
    });
    expect(checkSkillUpdatesMock).toHaveBeenCalledTimes(1);
  });
});
