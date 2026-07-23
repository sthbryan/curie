// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { ExploreSkeleton } from "@/pages/explore/components/ExploreSkeleton";

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

describe("ExploreSkeleton", () => {
  it("renders the default number of rows", () => {
    mount(<ExploreSkeleton />);
    const bones = container?.querySelectorAll(".animate-pulse");
    expect(bones?.length).toBe(8);
  });

  it("renders a custom number of rows", () => {
    mount(<ExploreSkeleton rows={3} />);
    const bones = container?.querySelectorAll(".animate-pulse");
    expect(bones?.length).toBe(3);
  });
});
