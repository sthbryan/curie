// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { Header } from "@/components/Header";
import { skillsLoading, skillUpdates, updatesLoading } from "@/store/skills";
import { lang } from "@/store/system";

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
  skillsLoading.value = false;
  updatesLoading.value = false;
  skillUpdates.value = [];
  window.history.pushState({}, "", "/");
});

describe("Header", () => {
  it("renders the breadcrumb for the current route", () => {
    mount(<Router><Header /></Router>);
    expect(container?.textContent).toMatch(/curie/i);
    expect(container?.textContent).toContain("HOME");
  });

  it("reports what the app is doing while skills load", () => {
    skillsLoading.value = true;
    mount(<Router><Header /></Router>);
    expect(container?.textContent).toContain("LOADING SKILLS");
  });

  it("stays quiet when nothing is happening", () => {
    mount(<Router><Header /></Router>);
    expect(container?.querySelector("button")).toBeNull();
  });

  it("offers a shortcut when skills are outdated", () => {
    skillUpdates.value = [
      { name: "pr-review", source: null, updateAvailable: true, checkable: true },
      { name: "shader-dev", source: null, updateAvailable: false, checkable: true },
    ];
    mount(<Router><Header /></Router>);
    expect(container?.querySelector("button")?.textContent).toContain("1 UPDATES");
  });

  it("hides the shortcut on the page that already shows it", () => {
    window.history.pushState({}, "", "/installed");
    skillUpdates.value = [
      { name: "pr-review", source: null, updateAvailable: true, checkable: true },
    ];
    mount(<Router><Header /></Router>);
    expect(container?.querySelector("button")).toBeNull();
  });
});
