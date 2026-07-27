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

function mount(rows: SkillSearchResult[]) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <ResultsPanel
        showHint={false}
        loading={false}
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
  it("scrolls inside itself instead of growing the page", () => {
    mount(results(40));
    const viewport = container?.querySelector(".overflow-y-auto");
    expect(viewport).not.toBeNull();
    expect(viewport?.className).toContain("flex-1");
    expect(viewport?.className).toContain("min-h-0");
  });

  it("keeps a long result set out of the dom", () => {
    mount(results(200));
    const rendered = container?.querySelectorAll("article").length ?? 0;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(40);
  });

  it("reserves the height of the rows it does not render", () => {
    mount(results(200));
    const padded = container?.querySelector("[style*='padding-bottom']") as HTMLElement | null;
    expect(padded).not.toBeNull();
    expect(Number.parseInt(padded?.style.paddingBottom ?? "0", 10)).toBeGreaterThan(1000);
  });
});
