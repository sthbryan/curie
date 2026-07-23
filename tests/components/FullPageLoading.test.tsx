// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { FullPageLoading } from "@/components/FullPageLoading";

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

describe("FullPageLoading", () => {
  it("renders the default loading label", () => {
    mount(<FullPageLoading lang="en" />);
    expect(container?.textContent).toContain("Loading");
  });

  it("renders a custom label when provided", () => {
    mount(<FullPageLoading lang="en" label="Working..." />);
    expect(container?.textContent).toContain("Working...");
  });
});
