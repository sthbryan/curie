// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { ActionProgress } from "@/components/ActionProgress";

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

const base = { labelKey: "installed.updatingOne", lang: "en" as const };

describe("ActionProgress", () => {
  it("returns null when not active", () => {
    mount(<ActionProgress {...base} active={false} />);
    expect(container?.textContent).toBe("");
  });

  it("renders a progressbar when active", () => {
    mount(<ActionProgress {...base} active={true} />);
    const bar = container?.querySelector('[role="progressbar"]');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute("aria-valuemin")).toBe("0");
    expect(bar?.getAttribute("aria-valuemax")).toBe("100");
    expect(container?.textContent).toMatch(/\d+%/);
  });

  it("applies className", () => {
    mount(<ActionProgress {...base} active={true} className="custom" />);
    expect(container?.querySelector('[role="progressbar"]')?.classList.contains("custom")).toBe(true);
  });
});
