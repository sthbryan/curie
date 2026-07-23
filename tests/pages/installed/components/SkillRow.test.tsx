// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillInfo } from "@/components/types";
import { lang } from "@/store/system";
import { SkillRow } from "@/pages/installed/components/SkillRow";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root?.render(ui); });
}

function unmount() {
  if (root) { act(() => { root?.unmount(); }); root = null; }
  if (container) { container.remove(); container = null; }
}

afterEach(unmount);
beforeEach(() => { lang.value = "en"; });

const skill: SkillInfo = {
  name: "impeccable",
  path: "/a/impeccable",
  scope: "global",
  agents: ["Codex"],
  source: "me/impeccable",
  sourceUrl: null,
  sourceType: "github",
  installedAt: "2026-07-10T10:00:00.000Z",
  updatedAt: null,
};

describe("SkillRow", () => {
  it("renders the skill name", () => {
    mount(<SkillRow skill={skill} lang="en" />);
    expect(container?.textContent).toContain("impeccable");
  });

  it("renders agent badges", () => {
    mount(<SkillRow skill={skill} lang="en" />);
    expect(container?.textContent).toContain("Codex");
  });
});
