// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StatusBar } from "@/components/StatusBar";
import { lang, node, theme } from "@/store/system";
import { appUpdate } from "@/store/update";

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
  theme.value = "dark";
  appUpdate.value = null;
});

describe("StatusBar", () => {
  it("renders setup required when no node", () => {
    mount(<StatusBar />);
    expect(container?.textContent).toContain("SETUP REQUIRED");
  });

  it("renders node info when node is installed and keeps the manager in the title", () => {
    node.value = { installed: true, version: "v22.0.0", manager: "volta", path: "/usr/local/bin/node" };
    mount(<StatusBar />);
    expect(container?.textContent).toContain("22.0.0");
    expect(container?.textContent).not.toContain("volta");
    expect(container?.querySelector("[title=volta]")).not.toBeNull();
  });

  it("says nothing when the app is up to date", () => {
    appUpdate.value = {
      updateAvailable: false,
      currentVersion: "0.2.0",
      latestVersion: "0.2.0",
      releaseUrl: null,
      releaseNotes: null,
    };
    mount(<StatusBar />);
    expect(container?.textContent).not.toMatch(/UP TO DATE/i);
  });

  it("cycles the theme from the status bar", () => {
    mount(<StatusBar />);
    const button = container?.querySelector("[aria-label=Theme]") as HTMLButtonElement;
    expect(button.textContent).toContain("DARK");

    act(() => { button.click(); });

    expect(theme.value).toBe("light");
  });

  it("toggles the language from the status bar", () => {
    mount(<StatusBar />);
    const button = container?.querySelector("[aria-label=Language]") as HTMLButtonElement;

    act(() => { button.click(); });

    expect(lang.value).toBe("es");
  });

  it("renders language code", () => {
    mount(<StatusBar />);
    expect(container?.textContent).toContain("EN");
  });
});
