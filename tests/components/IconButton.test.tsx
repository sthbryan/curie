// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IconButton } from "@/components/IconButton";

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

describe("IconButton", () => {
  it("renders with label and aria-label", () => {
    mount(<IconButton label="Close">×</IconButton>);
    const btn = container?.querySelector("button");
    expect(btn?.getAttribute("aria-label")).toBe("Close");
    expect(btn?.getAttribute("title")).toBe("Close");
  });

  it("renders children", () => {
    mount(<IconButton label="X"><span>X</span></IconButton>);
    expect(container?.textContent).toBe("X");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    mount(<IconButton label="X" onClick={onClick}>X</IconButton>);
    container?.querySelector("button")?.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("forwards disabled attribute", () => {
    mount(<IconButton label="X" disabled>X</IconButton>);
    expect(container?.querySelector("button")?.disabled).toBe(true);
  });
});
