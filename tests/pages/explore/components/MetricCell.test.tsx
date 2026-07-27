// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ExploreView, SkillExploreResult } from "@/components/types";
import { MetricCell } from "@/pages/explore/components/MetricCell";
import { lang } from "@/store/system";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

const result = (overrides: Partial<SkillExploreResult> = {}): SkillExploreResult => ({
  id: "1",
  name: "impeccable",
  source: "pbakaus",
  installs: 12400,
  package: "pbakaus@impeccable",
  url: "https://skills.sh/pbakaus/impeccable",
  installsYesterday: 320,
  change: 48,
  isOfficial: false,
  ...overrides,
});

function mount(view: ExploreView, row: SkillExploreResult) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<MetricCell view={view} result={row} />);
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

describe("MetricCell", () => {
  it("shows yesterday's installs on the hot board, with the total below", () => {
    mount("hot", result());
    expect(container?.textContent).toContain("+320");
    expect(container?.textContent).toContain("12K");
  });

  it("falls back to a dash when the board has no number for the row", () => {
    mount("hot", result({ installsYesterday: null }));
    expect(container?.textContent).toContain("—");
  });

  it("signs the trending change and keeps the total for context", () => {
    mount("trending", result());
    expect(container?.textContent).toContain("+48");
    expect(container?.textContent).toContain("12K");
    expect(container?.querySelector(".text-success")).not.toBeNull();
  });

  it("marks a falling trend with the error color", () => {
    mount("trending", result({ change: -12 }));
    expect(container?.textContent).toContain("-12");
    expect(container?.querySelector(".text-error")).not.toBeNull();
  });

  it("shows the total alone on the all-time board", () => {
    mount("all-time", result());
    expect(container?.textContent).toBe("12K");
  });
});
