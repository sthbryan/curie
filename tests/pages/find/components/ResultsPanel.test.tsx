// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { SkillSearchResult } from "@/components/types";
import { ResultsPanel } from "@/pages/find/components/ResultsPanel";
import { lang } from "@/store/system";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

const results = (n: number): SkillSearchResult[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    name: `skill-${i}`,
    source: "owner",
    installs: 100 + i,
    package: `owner@skill-${i}`,
    url: `https://skills.sh/owner/skill-${i}`,
  }));

function mount(rows: SkillSearchResult[], loading = false) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <ResultsPanel
        showHint={false}
        loading={loading}
        empty={false}
        results={rows}
        installedPackages={new Set()}
        installingPackage={null}
        installBusy={false}
        onInstall={() => {}}
        onGoExplore={() => {}}
      />,
    );
  });
}

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

beforeEach(() => {
  lang.value = "en";
});

describe("ResultsPanel", () => {
  it("handles its own scrolling instead of growing the page", () => {
    mount(results(40));
    const wrap = container?.querySelector(".sph-table-wrap");
    expect(wrap).not.toBeNull();
    expect(wrap?.className).toContain("flex-1");
    expect(wrap?.className).toContain("min-h-0");
    expect(wrap?.getAttribute("data-virtual")).toBe("true");
  });

  it("renders a row per result", () => {
    mount(results(40));
    expect(container?.querySelectorAll("tbody tr").length).toBe(40);
    expect(container?.textContent).toContain("skill-39");
  });

  it("shows skeleton rows while the search is in flight", () => {
    mount([], true);
    expect(container?.querySelectorAll(".sph-skeleton").length).toBeGreaterThan(0);
    expect(container?.querySelector("tbody")).toBeNull();
  });
});
