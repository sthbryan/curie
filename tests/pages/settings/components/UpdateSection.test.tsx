// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lang } from "@/store/system";
import {
  appInstallRunning,
  appUpdate,
  appUpdateCheckedAt,
  appUpdateError,
  appUpdateLoading,
} from "@/store/update";

const openUrl = vi.fn();
vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: (...args: unknown[]) => openUrl(...args),
}));

const checkAppUpdate = vi.fn();
vi.mock("@/lib/boot", () => ({
  checkAppUpdate: () => checkAppUpdate(),
  installAppUpdate: () => Promise.resolve(null),
}));

const { UpdateSection } = await import("@/pages/settings/components/UpdateSection");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root?.render(<UpdateSection />); });
}

beforeEach(() => {
  lang.value = "en";
  appUpdate.value = null;
  appUpdateLoading.value = false;
  appUpdateError.value = null;
  appUpdateCheckedAt.value = null;
  appInstallRunning.value = false;
  openUrl.mockReset();
  checkAppUpdate.mockReset();
});

afterEach(() => {
  if (root) { act(() => { root?.unmount(); }); root = null; }
  if (container) { container.remove(); container = null; }
});

describe("UpdateSection", () => {
  it("says it has never checked before the first run", () => {
    render();
    expect(container?.textContent).toContain("Never checked");
  });

  it("reports when the last check happened", () => {
    appUpdateCheckedAt.value = new Date(Date.now() - 5 * 60_000).toISOString();
    render();
    expect(container?.textContent).toMatch(/Checked 5m ago/);
  });

  it("surfaces the failure instead of swallowing it", () => {
    appUpdateError.value = "Failed to fetch latest release: dns error";
    render();
    expect(container?.textContent).toContain("Could not check for updates");
    expect(container?.textContent).toContain("dns error");
  });

  it("announces the outcome to assistive tech", () => {
    appUpdate.value = {
      currentVersion: "0.2.0",
      latestVersion: "0.2.0",
      updateAvailable: false,
      releaseUrl: null,
      releaseNotes: null,
    };
    render();
    const live = container?.querySelector("[aria-live=polite]");
    expect(live?.textContent).toContain("Curie is up to date");
  });

  it("offers the install and the release page when an update is available", () => {
    appUpdate.value = {
      currentVersion: "0.2.0",
      latestVersion: "0.3.0",
      updateAvailable: true,
      releaseUrl: "https://example.test/release",
      releaseNotes: null,
    };
    render();
    expect(container?.textContent).toContain("v0.3.0");

    const buttons = [...(container?.querySelectorAll("button") ?? [])];
    const release = buttons.find((b) => b.textContent?.includes("OPEN GITHUB"));
    act(() => { release?.click(); });

    expect(openUrl).toHaveBeenCalledWith("https://example.test/release");
  });

  it("runs a check and blocks a second one while it is running", () => {
    render();
    const button = container?.querySelector("button") as HTMLButtonElement;
    act(() => { button.click(); });
    expect(checkAppUpdate).toHaveBeenCalledTimes(1);

    act(() => { appUpdateLoading.value = true; });
    const busy = container?.querySelector("button") as HTMLButtonElement;
    expect(busy.disabled).toBe(true);
    expect(busy.textContent).toContain("CHECKING FOR UPDATES");
  });
});
