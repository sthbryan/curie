// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { skills } from "@/store/skills";
import { lang } from "@/store/system";
import { InstalledFilters } from "@/pages/installed/components/InstalledFilters";
import { agentFilter, query, updatesOnly } from "@/pages/installed/store/store";

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
beforeEach(() => {
  lang.value = "en";
  query.value = "";
  agentFilter.value = null;
  updatesOnly.value = false;
  skills.value = [{ name: "test", path: "/a/test", scope: "global", agents: ["Codex"], source: "me/test", sourceUrl: null, sourceType: "github", installedAt: "2026-01-01", updatedAt: null }];
});

describe("InstalledFilters", () => {
  it("renders the search input", () => {
    mount(<InstalledFilters />);
    const input = container?.querySelector('input[type="search"]');
    expect(input).not.toBeNull();
  });

  it("renders the filter all button", () => {
    mount(<InstalledFilters />);
    expect(container?.textContent).toContain("ALL");
  });
});
