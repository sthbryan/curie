// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { Label } from "@/components/Label";

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

describe("Label", () => {
  it("renders the translated text", () => {
    mount(<Label>nav.home</Label>);
    expect(container?.textContent).toContain("HOME");
  });

  it("applies className", () => {
    mount(<Label className="custom">nav.home</Label>);
    expect(container?.querySelector(".custom")).not.toBeNull();
  });
});
