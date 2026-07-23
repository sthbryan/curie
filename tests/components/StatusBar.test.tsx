// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StatusBar } from "@/components/StatusBar";
import { lang, node } from "@/store/system";

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
beforeEach(() => {
  lang.value = "en";
  node.value = null;
});

describe("StatusBar", () => {
  it("renders setup required when no node", () => {
    mount(<StatusBar />);
    expect(container?.textContent).toContain("SETUP REQUIRED");
  });

  it("renders node info when node is installed", () => {
    node.value = { installed: true, version: "v22.0.0", manager: "volta", path: "/usr/local/bin/node" };
    mount(<StatusBar />);
    expect(container?.textContent).toContain("22.0.0");
    expect(container?.textContent).toContain("volta");
  });

  it("renders language code", () => {
    mount(<StatusBar />);
    expect(container?.textContent).toContain("EN");
  });
});
