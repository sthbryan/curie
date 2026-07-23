// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { useAsymptoticProgress } from "@/lib/useAsymptoticProgress";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
const results: number[] = [];

function TestComponent({ active, cap }: { active: boolean; cap?: number }) {
  const pct = useAsymptoticProgress(active, cap);
  results.push(pct);
  return <div>{pct}</div>;
}

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

afterEach(() => {
  unmount();
  results.length = 0;
});

describe("useAsymptoticProgress", () => {
  it("starts at 0 percent", () => {
    mount(<TestComponent active={false} />);
    expect(results[0]).toBe(0);
  });

  it("returns 0 when not active", () => {
    mount(<TestComponent active={false} />);
    expect(container?.textContent).toBe("0");
  });
});
