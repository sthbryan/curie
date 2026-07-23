// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { House } from "lucide-react";
import { NavItem } from "@/components/NavItem";

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

describe("NavItem", () => {
  it("renders label and number", () => {
    mount(<NavItem number="01" label="Home" icon={House} active={false} expanded={false} onClick={vi.fn()} />);
    expect(container?.textContent).toContain("Home");
    expect(container?.textContent).toContain("01");
  });

  it("marks aria-current when active", () => {
    mount(<NavItem number="01" label="Home" icon={House} active={true} expanded={false} onClick={vi.fn()} />);
    const btn = container?.querySelector("button");
    expect(btn?.getAttribute("aria-current")).toBe("page");
  });
});
