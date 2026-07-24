// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { lang } from "@/store/system";
import { Custom } from "@/pages/custom/index";

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
beforeEach(() => { lang.value = "en"; });

describe("Custom", () => {
  it("renders the title", () => {
    mount(<Router><Custom /></Router>);
    expect(container?.textContent).toContain("Build your own skill");
  });

  it("renders the new editorial subtitle", () => {
    mount(<Router><Custom /></Router>);
    expect(container?.textContent).toContain("Authored by you. On your disk. Yours.");
  });

  it("renders the URL install form", () => {
    mount(<Router><Custom /></Router>);
    expect(container?.textContent).toContain("Install from a GitHub URL");
    expect(container?.textContent).toContain("INSTALL");
  });

  it("renders the MD upload form", () => {
    mount(<Router><Custom /></Router>);
    expect(container?.textContent).toContain("Create a custom skill");
    expect(container?.textContent).toContain("UPLOAD .MD");
    expect(container?.textContent).toContain("SAVE SKILL");
  });
});
