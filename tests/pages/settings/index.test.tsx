// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import {
  hasBooted,
  lang,
  node,
  reducedMotion,
  setLang,
  setNode,
  stage,
  theme,
} from "@/store/system";

const openUrl = vi.fn();
vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: (...args: unknown[]) => openUrl(...args),
}));

const { Settings } = await import("@/pages/settings/index");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function render(ui: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Router>{ui}</Router>);
  });
}

beforeEach(() => {
  theme.value = "dark";
  lang.value = "en";
  reducedMotion.value = "user";
  hasBooted.value = false;
  stage.value = "loading";
  node.value = null;
  openUrl.mockReset();
});

afterEach(() => {
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
});

describe("Settings", () => {
  it("renders the title, language, theme, and reduced-motion sections in English", () => {
    render(<Settings />);
    expect(container?.textContent).toContain("Settings");
    expect(container?.textContent).toContain("Language");
    expect(container?.textContent).toContain("Theme");
    expect(container?.textContent).toContain("Reduce motion");
    expect(container?.textContent).toContain("English");
  });

  it("renders Spanish copy when lang=es", () => {
    setLang("es");
    render(<Settings />);
    expect(container?.textContent).toContain("Ajustes");
    expect(container?.textContent).toContain("Idioma");
  });

  it("switches the language when a ChoiceButton is clicked", () => {
    render(<Settings />);
    const enButtons = Array.from(container?.querySelectorAll("button") ?? []).filter(
      (b) => b.textContent === "EN",
    );
    const esButtons = Array.from(container?.querySelectorAll("button") ?? []).filter(
      (b) => b.textContent === "ES",
    );

    act(() => {
      esButtons[0]?.click();
    });
    expect(lang.value).toBe("es");

    act(() => {
      enButtons[0]?.click();
    });
    expect(lang.value).toBe("en");
  });

  it("switches the theme when a ThemeCard is clicked", () => {
    render(<Settings />);
    const rose = container?.querySelector('[data-theme-option="rose"]') as HTMLButtonElement | null;
    act(() => {
      rose?.click();
    });
    expect(theme.value).toBe("rose");
  });

  it("shows the system info block when node is installed", () => {
    setNode({
      installed: true,
      version: "v20.0.0",
      path: "/usr/bin/node",
      manager: "volta",
    });
    render(<Settings />);
    expect(container?.textContent).toContain("NODE");
    expect(container?.textContent).toContain("20.0.0");
    expect(container?.textContent).toContain("volta");
    expect(container?.textContent).toContain("/usr/bin/node");
  });

  it("shows the 'go to setup' message when node is missing", () => {
    render(<Settings />);
    expect(container?.textContent).toContain("Node not detected");
    expect(container?.textContent).toContain("GO BACK TO SETUP");
  });

  it("opens the GitHub URL when the repo link is clicked", () => {
    render(<Settings />);
    const link = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.includes("github.com/sthbryan/curie"),
    );
    act(() => {
      link?.click();
    });
    expect(openUrl).toHaveBeenCalledWith("https://github.com/sthbryan/curie");
  });
});
