// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NodeInfo, ProgressEvent } from "@/components/types";
import { useSystemStore } from "@/store/system";

const invokeMock = vi.fn();
const listenMock = vi.fn();
const openUrlMock = vi.fn();
const loadGlobalSkillsMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));
vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: unknown[]) => listenMock(...args),
}));
vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: (...args: unknown[]) => openUrlMock(...args),
}));
vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

const { Setup } = await import("./index");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function render(ui: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(ui);
  });
}

const installedNode: NodeInfo = {
  installed: true,
  version: "v20.0.0",
  path: "/usr/bin/node",
  manager: "volta",
};

const unlisten = vi.fn();

beforeEach(() => {
  invokeMock.mockReset();
  listenMock.mockReset();
  openUrlMock.mockReset();
  loadGlobalSkillsMock.mockClear();
  unlisten.mockReset();
  listenMock.mockResolvedValue(unlisten);
  useSystemStore.setState({
    theme: "dark",
    lang: "en",
    reducedMotion: "system",
    hasBooted: true,
    stage: "setup",
    node: null,
  });
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

describe("Setup", () => {
  it("renders the initial setup screen with the install CTA", () => {
    render(<Setup onComplete={() => {}} />);
    expect(container?.textContent).toContain("DO IT FOR ME");
    expect(container?.textContent).toContain("Node.js");
  });

  it("transitions to the installing screen and invokes install_node", async () => {
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "install_node") return new Promise(() => {});
      return Promise.resolve(undefined);
    });
    render(<Setup onComplete={() => {}} />);

    const installBtn = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.toUpperCase().includes("DO IT FOR ME"),
    );
    expect(installBtn).toBeDefined();
    await act(async () => {
      installBtn?.click();
    });

    expect(invokeMock).toHaveBeenCalledWith("install_node");
    expect(container?.textContent).toMatch(/installing|checking|download|verifying/i);
  });

  it("calls onComplete when the user clicks continue after a successful install", async () => {
    const onComplete = vi.fn();
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "install_node") {
        // Simulate the progress event firing then completing.
        setTimeout(() => {
          // The listen mock captured the handler; call it.
          const handler = listenMock.mock.calls[0]?.[1] as
            | ((event: { payload: ProgressEvent }) => void)
            | undefined;
          handler?.({ payload: { stage: "done", message: "ok", done: true } });
        }, 0);
        return Promise.resolve();
      }
      if (cmd === "detect_node") return Promise.resolve(installedNode);
      return Promise.resolve(undefined);
    });

    render(<Setup onComplete={onComplete} />);

    const installBtn = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.toUpperCase().includes("DO IT FOR ME"),
    );
    await act(async () => {
      installBtn?.click();
    });
    // Let the progress event fire.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const continueBtn = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.toUpperCase().includes("CONTINUE"),
    );
    expect(continueBtn).toBeDefined();
    await act(async () => {
      continueBtn?.click();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(invokeMock).toHaveBeenCalledWith("detect_node");
    expect(onComplete).toHaveBeenCalledWith(installedNode);
  });
});
