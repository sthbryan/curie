// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeCard } from "@/pages/settings/components/ThemeCard";

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

describe("ThemeCard", () => {
  it("renders label and hint", () => {
    mount(<ThemeCard id="dark" active={false} label="Dark" hint="darker" swatches={["#000","#111","#222"]} onClick={vi.fn()} />);
    expect(container?.textContent).toContain("Dark");
    expect(container?.textContent).toContain("darker");
  });

  it("marks aria-pressed when active", () => {
    mount(<ThemeCard id="light" active={true} label="Light" hint="brighter" swatches={["#fff","#eee","#ccc"]} onClick={vi.fn()} />);
    const btn = container?.querySelector("button");
    expect(btn?.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    mount(<ThemeCard id="dark" active={false} label="Dark" hint="" swatches={["#000","#111","#222"]} onClick={onClick} />);
    container?.querySelector("button")?.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
