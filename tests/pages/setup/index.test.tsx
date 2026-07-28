// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NodeInfo, ProgressEvent, SetupPlan } from "@/components/types";
import { hasBooted, lang, node, reducedMotion, stage, theme } from "@/store/system";

const invokeMock = vi.fn();
const listenMock = vi.fn();
const openUrlMock = vi.fn();
const loadSkillsMock = vi.fn().mockResolvedValue(undefined);

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
  loadSkills: (...args: unknown[]) => loadSkillsMock(...args),
}));

const { Setup } = await import("@/pages/setup/index");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function render(ui: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(ui);
  });
}

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function button(label: string) {
  return Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
    b.textContent?.toUpperCase().includes(label),
  );
}

function emit(stageName: string) {
  const handler = listenMock.mock.calls[0]?.[1] as
    | ((event: { payload: ProgressEvent }) => void)
    | undefined;
  handler?.({ payload: { stage: stageName, message: "", done: false } });
}

const missingNode: NodeInfo = {
  installed: false,
  version: null,
  path: null,
  manager: null,
};

const installedNode: NodeInfo = {
  installed: true,
  version: "v22.11.0",
  path: "/Users/alice/.volta/bin/node",
  manager: "volta",
};

const withManager: SetupPlan = {
  node: missingNode,
  manager: { id: "fnm", path: "/opt/homebrew/bin/fnm" },
  steps: ["check", "node", "verify"],
  command: "fnm install --lts && fnm default lts-latest",
};

const withoutManager: SetupPlan = {
  node: missingNode,
  manager: null,
  steps: ["check", "volta", "node", "verify"],
  command: "curl -fsSL https://get.volta.sh | bash\nvolta install node",
};

function mockPlan(plan: SetupPlan, overrides: Record<string, () => unknown> = {}) {
  invokeMock.mockImplementation((cmd: string) => {
    if (cmd === "plan_node_setup") return Promise.resolve(plan);
    const override = overrides[cmd];
    if (override) return override();
    return Promise.resolve(undefined);
  });
}

const unlisten = vi.fn();

beforeEach(() => {
  invokeMock.mockReset();
  listenMock.mockReset();
  openUrlMock.mockReset();
  loadSkillsMock.mockClear();
  unlisten.mockReset();
  listenMock.mockResolvedValue(unlisten);
  theme.value = "dark";
  lang.value = "en";
  reducedMotion.value = "user";
  hasBooted.value = false;
  stage.value = "loading";
  node.value = null;
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
  it("announces the manager it found and offers to reuse it", async () => {
    mockPlan(withManager);
    render(<Setup onComplete={() => {}} />);
    await flush();

    expect(invokeMock).toHaveBeenCalledWith("plan_node_setup");
    expect(container?.textContent).toContain("fnm is already installed");
    expect(container?.textContent).toContain("/opt/homebrew/bin/fnm");
    expect(container?.textContent).toContain("REUSED");
    expect(container?.textContent).not.toContain("No version manager found");
    expect(button("DO IT FOR ME")).toBeDefined();
  });

  it("falls back to installing volta when no manager is around", async () => {
    mockPlan(withoutManager);
    render(<Setup onComplete={() => {}} />);
    await flush();

    expect(container?.textContent).toContain("No version manager found");
    expect(container?.textContent).toContain("Volta");
    expect(container?.textContent).toContain("WILL BE ADDED");
  });

  it("walks the steps of the plan as progress events arrive", async () => {
    mockPlan(withManager, { install_node: () => new Promise(() => {}) });
    render(<Setup onComplete={() => {}} />);
    await flush();

    await act(async () => {
      button("DO IT FOR ME")?.click();
    });
    expect(invokeMock).toHaveBeenCalledWith("install_node");

    const items = () => Array.from(container?.querySelectorAll("li") ?? []);
    expect(items()).toHaveLength(3);
    expect(container?.textContent).toContain("Installing Node.js with fnm");
    expect(container?.textContent).not.toContain("Installing Volta");

    await act(async () => {
      emit("node");
    });
    expect(items()[1]?.getAttribute("aria-current")).toBe("step");
    expect(items()[0]?.getAttribute("aria-current")).toBeNull();
  });

  it("hands the installed node to onComplete when the user continues", async () => {
    const onComplete = vi.fn();
    mockPlan(withManager, { install_node: () => Promise.resolve(installedNode) });
    render(<Setup onComplete={onComplete} />);
    await flush();

    await act(async () => {
      button("DO IT FOR ME")?.click();
    });
    await flush();

    expect(container?.textContent).toContain("v22.11.0");
    await act(async () => {
      button("CONTINUE")?.click();
    });
    await flush();

    expect(onComplete).toHaveBeenCalledWith(installedNode);
    expect(loadSkillsMock).toHaveBeenCalled();
  });

  it("shows the failure and the command to run by hand", async () => {
    mockPlan(withoutManager, { install_node: () => Promise.reject("volta exited with 1") });
    render(<Setup onComplete={() => {}} />);
    await flush();

    await act(async () => {
      button("DO IT FOR ME")?.click();
    });
    await flush();

    expect(container?.querySelector("[role='alert']")?.textContent).toContain(
      "volta exited with 1",
    );
    expect(container?.querySelector("pre")?.textContent).toContain("get.volta.sh");
  });

  it("keeps the manual command hidden until asked for it", async () => {
    mockPlan(withManager);
    render(<Setup onComplete={() => {}} />);
    await flush();

    expect(container?.querySelector("pre")).toBeNull();
    await act(async () => {
      button("I'LL DO IT MYSELF")?.click();
    });

    expect(container?.querySelector("pre")?.textContent).toBe(withManager.command);
  });
});
