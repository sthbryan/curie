// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FullPageError } from "@/components/FullPageError";

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

describe("FullPageError", () => {
  it("renders the message", () => {
    mount(<FullPageError message="fail" onRetry={vi.fn()} />);
    expect(container?.textContent).toContain("fail");
  });

  it("calls onRetry when button is clicked", () => {
    const onRetry = vi.fn();
    mount(<FullPageError message="fail" onRetry={onRetry} />);
    const btn = container?.querySelector("button");
    btn?.click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
