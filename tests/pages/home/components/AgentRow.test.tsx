// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { lang } from "@/store/system";
import { AgentRow } from "@/pages/home/components/AgentRow";

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

describe("AgentRow", () => {
  it("renders agent label and count", () => {
    mount(<AgentRow lang="en" agent={{ label: "Codex", count: 5, skills: 5 }} capacity={10} />);
    expect(container?.textContent).toContain("Codex");
    expect(container?.textContent).toContain("5");
  });
});
