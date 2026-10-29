// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";

import { Sidebar } from "@/components/Sidebar";
import { lang, sidebarOpen } from "@/store/system";

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

function aside() {
  return container?.querySelector("aside") as HTMLElement | null;
}

function toggle() {
  const button = container?.querySelector(".sph-sidebar__toggle") as HTMLButtonElement | null;
  if (!button) throw new Error("sidebar toggle not found");
  return button;
}

afterEach(unmount);
beforeEach(() => {
  lang.value = "en";
  sidebarOpen.value = false;
  window.history.replaceState({}, "", "/find");
});

describe("Sidebar", () => {
  it("renders every section plus the settings entry", () => {
    mount();
    const items = Array.from(container?.querySelectorAll(".sph-sidebar__item") ?? []);
    expect(items).toHaveLength(7);
    expect(container?.textContent).toContain("HOME");
    expect(container?.textContent).toContain("SETTINGS");
  });

  it("stays in the flow as a fixed rail, not an overlay", () => {
    mount();
    const rail = aside();
    expect(rail?.className).not.toContain("absolute");
    expect(rail?.getAttribute("data-collapsed-mode")).toBe("rail");
    expect(rail?.hasAttribute("data-rail")).toBe(true);
  });

  it("opens and closes from its own button and remembers the choice", () => {
    mount();
    expect(toggle().getAttribute("aria-label")).toBe("Expand sidebar");

    act(() => {
      toggle().click();
    });
    expect(sidebarOpen.value).toBe(true);
    expect(aside()?.hasAttribute("data-rail")).toBe(false);
    expect(toggle().getAttribute("aria-label")).toBe("Collapse sidebar");

    unmount();
    mount();
    expect(aside()?.hasAttribute("data-rail")).toBe(false);
  });

  it("marks the current section", () => {
    mount();
    const current = container?.querySelector('[aria-current="page"]');
    expect(current?.textContent).toContain("FIND");
  });

  it("navigates when an item is clicked", () => {
    mount();
    const home = Array.from(container?.querySelectorAll(".sph-sidebar__item") ?? []).find(
      (button) => button.textContent?.includes("HOME"),
    ) as HTMLButtonElement | undefined;
    act(() => {
      home?.click();
    });
    expect(window.location.pathname).toBe("/");
  });
});
