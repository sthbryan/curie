// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NodeInfo, SkillInfo, SkillUpdateInfo } from "@/components/types";
import { useSkillsStore } from "@/store/skills";
import { useSystemStore } from "@/store/system";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

// Must import after the mock is registered.
const { checkSkillUpdates, loadGlobalSkills, useBoot } = await import("./boot");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const nodeInstalled: NodeInfo = {
  installed: true,
  version: "20.0.0",
  path: "/usr/bin/node",
  manager: "volta",
};

const nodeMissing: NodeInfo = {
  installed: false,
  version: null,
  path: null,
  manager: null,
};

const sampleSkills: SkillInfo[] = [
  {
    name: "impeccable",
    path: "/a/impeccable",
    scope: "global",
    agents: ["Codex"],
    source: "pbakaus/impeccable",
    sourceUrl: null,
    sourceType: "github",
    installedAt: "2026-07-10T10:00:00.000Z",
    updatedAt: null,
  },
];

const sampleUpdates: SkillUpdateInfo[] = [
  {
    name: "impeccable",
    source: "pbakaus/impeccable",
    updateAvailable: true,
    checkable: true,
  },
];

beforeEach(() => {
  invokeMock.mockReset();
  localStorage.clear();
  useSkillsStore.setState({
    skills: [],
    skillsLoading: false,
    skillsError: null,
    skillUpdates: [],
    updatesLoading: false,
    updatesError: null,
  });
  useSystemStore.setState({
    theme: "dark",
    lang: "en",
    reducedMotion: "system",
    hasBooted: false,
    stage: "loading",
    node: null,
  });
});

describe("loadGlobalSkills", () => {
  it("stores the listed skills and triggers a check for updates by default", async () => {
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "list_skills") return Promise.resolve(sampleSkills);
      if (cmd === "check_skill_updates") return Promise.resolve(sampleUpdates);
      return Promise.reject(new Error(`unknown command: ${cmd}`));
    });

    await loadGlobalSkills();

    const s = useSkillsStore.getState();
    expect(s.skills).toBe(sampleSkills);
    expect(s.skillsError).toBeNull();
    expect(s.skillsLoading).toBe(false);
    expect(invokeMock).toHaveBeenCalledWith("list_skills");
    expect(invokeMock).toHaveBeenCalledWith("check_skill_updates");
  });

  it("skips the update check when checkUpdates=false", async () => {
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "list_skills") return Promise.resolve(sampleSkills);
      return Promise.reject(new Error(`unexpected command: ${cmd}`));
    });

    await loadGlobalSkills({ checkUpdates: false });
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith("list_skills");
  });

  it("records an error when list_skills rejects", async () => {
    invokeMock.mockImplementation(() => Promise.reject(new Error("boom")));
    await loadGlobalSkills();
    const s = useSkillsStore.getState();
    expect(s.skillsError).toBe("boom");
    expect(s.skillsLoading).toBe(false);
  });
});

describe("checkSkillUpdates", () => {
  it("stores the update list and clears any prior error", async () => {
    invokeMock.mockImplementation(() => Promise.resolve(sampleUpdates));
    useSkillsStore.getState().setUpdatesError("stale");

    await checkSkillUpdates();

    const s = useSkillsStore.getState();
    expect(s.skillUpdates).toBe(sampleUpdates);
    expect(s.updatesError).toBeNull();
    expect(s.updatesLoading).toBe(false);
  });

  it("records the rejection message and clears loading", async () => {
    invokeMock.mockImplementation(() => Promise.reject("plain string error"));

    await checkSkillUpdates();

    const s = useSkillsStore.getState();
    expect(s.updatesError).toBe("plain string error");
    expect(s.updatesLoading).toBe(false);
  });
});

// useBoot needs a React render context.
let root: Root | null = null;
let container: HTMLDivElement | null = null;
let mounted: React.ReactElement | null = null;

function BootHarness() {
  useBoot();
  return null;
}

function mountHarness() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mounted = <BootHarness />;
  act(() => {
    root?.render(mounted);
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
  mounted = null;
}

afterEach(() => {
  unmount();
});

describe("useBoot", () => {
  it("detects a missing node and routes to the setup stage", async () => {
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "get_locale") return Promise.resolve("es-MX");
      if (cmd === "detect_node") return Promise.resolve(nodeMissing);
      return Promise.reject(new Error(`unexpected: ${cmd}`));
    });

    mountHarness();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const s = useSystemStore.getState();
    expect(s.lang).toBe("es");
    expect(s.node).toEqual(nodeMissing);
    expect(s.stage).toBe("setup");
    expect(s.hasBooted).toBe(true);
  });

  it("routes to home and loads skills when node is installed", async () => {
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "get_locale") return Promise.resolve("en-US");
      if (cmd === "detect_node") return Promise.resolve(nodeInstalled);
      if (cmd === "list_skills") return Promise.resolve(sampleSkills);
      if (cmd === "check_skill_updates") return Promise.resolve(sampleUpdates);
      return Promise.reject(new Error(`unexpected: ${cmd}`));
    });

    mountHarness();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const ui = useSystemStore.getState();
    const skills = useSkillsStore.getState();
    expect(ui.node).toEqual(nodeInstalled);
    expect(ui.stage).toBe("home");
    expect(ui.hasBooted).toBe(true);
    expect(skills.skills).toBe(sampleSkills);
  });

  it("falls back to default lang when get_locale rejects", async () => {
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "get_locale") return Promise.reject(new Error("nope"));
      if (cmd === "detect_node") return Promise.resolve(nodeInstalled);
      if (cmd === "list_skills") return Promise.resolve([]);
      if (cmd === "check_skill_updates") return Promise.resolve([]);
      return Promise.reject(new Error(`unexpected: ${cmd}`));
    });

    mountHarness();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(useSystemStore.getState().lang).toBe("en");
  });

  it("falls back to setup stage when detect_node rejects", async () => {
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "get_locale") return Promise.resolve("en-US");
      if (cmd === "detect_node") return Promise.reject(new Error("no node"));
      return Promise.reject(new Error(`unexpected: ${cmd}`));
    });

    mountHarness();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const s = useSystemStore.getState();
    expect(s.stage).toBe("setup");
    expect(s.hasBooted).toBe(true);
  });

  it("skips get_locale on a re-mount when hasBooted is already true", async () => {
    useSystemStore.getState().markBooted();
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "detect_node") return Promise.resolve(nodeInstalled);
      if (cmd === "list_skills") return Promise.resolve([]);
      if (cmd === "check_skill_updates") return Promise.resolve([]);
      return Promise.reject(new Error(`unexpected: ${cmd}`));
    });

    mountHarness();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const calledCommands = invokeMock.mock.calls.map(([cmd]) => cmd);
    expect(calledCommands).not.toContain("get_locale");
    expect(calledCommands).toContain("detect_node");
  });

  it("cancels in-flight work when unmounted before the invoke resolves", async () => {
    type Resolver = (value: unknown) => void;
    const resolvers: Resolver[] = [];
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "get_locale") return Promise.resolve("en-US");
      if (cmd === "detect_node")
        return new Promise((resolve) => {
          resolvers.push(resolve as Resolver);
        });
      return Promise.reject(new Error(`unexpected: ${cmd}`));
    });

    mountHarness();
    // Unmount before detect_node resolves.
    unmount();
    const resolveDetect = resolvers[0];
    if (resolveDetect) resolveDetect(nodeInstalled);

    // Yield so any pending microtasks settle.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    // The cancelled branch must not have written to the store.
    expect(useSystemStore.getState().hasBooted).toBe(false);
    expect(useSystemStore.getState().node).toBeNull();
  });
});
