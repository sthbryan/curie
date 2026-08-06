// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { lang } from "@/store/system";
import { Sidebar } from "@/components/Sidebar";

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

describe("Sidebar", () => {
  it("renders nav items", () => {
    mount(<Router><Sidebar /></Router>);
    expect(container?.querySelector("nav")).not.toBeNull();
  });

  it("keeps the rail out of the flow so the page never reflows", () => {
    mount(<Router><Sidebar /></Router>);
    const nav = container?.querySelector("nav");
    expect(nav?.className).toContain("absolute");
    expect((container?.firstElementChild as HTMLElement | null)?.style.width).toBe("50px");
  });

  it("reveals the labels when a nav item takes focus", () => {
    mount(<Router><Sidebar /></Router>);
    const label = () => container?.querySelector("button > span:last-child") as HTMLElement;

    expect(label().getAttribute("aria-hidden")).toBe("true");
    expect(label().className).toContain("opacity-0");

    const first = container?.querySelector("button") as HTMLButtonElement;
    act(() => { first.focus(); });

    expect(label().getAttribute("aria-hidden")).toBe("false");
    expect(label().className).toContain("opacity-100");
    expect(label().textContent).toContain("HOME");
  });
});
