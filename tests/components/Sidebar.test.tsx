// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";

import { Sidebar } from "@/components/Sidebar";
import { lang } from "@/store/system";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <Router>
        <Sidebar />
      </Router>,
    );
  });
}

function unmount() {
  if (root) {
    act(() => {
      root?.unmount();
    });
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
}

afterEach(unmount);
beforeEach(() => {
  lang.value = "en";
  window.history.replaceState({}, "", "/find");
});

describe("Sidebar", () => {
  it("renders every section plus the settings entry", () => {
    mount();
    const items = Array.from(container?.querySelectorAll("button") ?? []);
    expect(items).toHaveLength(7);
    expect(container?.textContent).toContain("HOME");
    expect(container?.textContent).toContain("SETTINGS");
  });

  it("keeps the rail out of the flow so the page never reflows", () => {
    mount();
    const aside = container?.querySelector("aside");
    expect(aside?.className).toContain("absolute");
    expect((container?.firstElementChild as HTMLElement | null)?.style.width).toBe("56px");
  });

  it("collapses to a rail that expands on hover and focus", () => {
    mount();
    const aside = container?.querySelector("aside");
    expect(aside?.getAttribute("data-collapsed-mode")).toBe("hover");
    expect(aside?.hasAttribute("data-rail")).toBe(true);
  });

  it("marks the current section", () => {
    mount();
    const current = container?.querySelector('[aria-current="page"]');
    expect(current?.textContent).toContain("FIND");
  });

  it("navigates when an item is clicked", () => {
    mount();
    const home = Array.from(container?.querySelectorAll("button") ?? []).find((button) =>
      button.textContent?.includes("HOME"),
    );
    act(() => {
      home?.click();
    });
    expect(window.location.pathname).toBe("/");
  });
});
