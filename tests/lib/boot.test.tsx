// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NodeInfo, SkillInfo, SkillUpdateInfo } from "@/components/types";
import {
  setUpdatesError,
  skills,
  skillsError,
  skillsLoading,
  skillUpdates,
  updatesError,
  updatesLoading,
} from "@/store/skills";
import { hasBooted, lang, node, reducedMotion, stage, theme } from "@/store/system";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

const { checkSkillUpdates, loadGlobalSkills, useBoot } = await import("@/lib/boot");

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
  skills.value = [];
  skillsLoading.value = false;
  skillsError.value = null;
  skillUpdates.value = [];
  updatesLoading.value = false;
  updatesError.value = null;
  theme.value = "dark";
  lang.value = "en";
  reducedMotion.value = "user";
  hasBooted.value = false;
  stage.value = "loading";
  node.value = null;
});

describe("loadGlobalSkills", () => {
  it("stores the listed skills and triggers a check for updates by default", async () => {
    invokeMock.mockImplementation((cmd) => {
      if (cmd === "list_skills") return Promise.resolve(sampleSkills);
      if (cmd === "check_skill_updates") return Promise.resolve(sampleUpdates);
      return Promise.reject(new Error(`unknown command: ${cmd}`));
    });

    await loadGlobalSkills();

    expect(skills.value).toBe(sampleSkills);
    expect(skillsError.value).toBeNull();
    expect(skillsLoading.value).toBe(false);
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
    expect(skillsError.value).toBe("boom");
    expect(skillsLoading.value).toBe(false);
  });
});

describe("checkSkillUpdates", () => {
  it("stores the update list and clears any prior error", async () => {
    invokeMock.mockImplementation(() => Promise.resolve(sampleUpdates));
    setUpdatesError("stale");

    await checkSkillUpdates();

    expect(skillUpdates.value).toBe(sampleUpdates);
    expect(updatesError.value).toBeNull();
    expect(updatesLoading.value).toBe(false);
  });

  it("records the rejection message and clears loading", async () => {
    invokeMock.mockImplementation(() => Promise.reject("plain string error"));

    await checkSkillUpdates();

    expect(updatesError.value).toBe("plain string error");
    expect(updatesLoading.value).toBe(false);
  });
});

// useBoot needs a render context.
let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function BootHarness() {
  useBoot();
  return null;
}

function mountHarness() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  const mounted = <BootHarness />;
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

    expect(lang.value).toBe("es");
    expect(node.value).toEqual(nodeMissing);
    expect(stage.value).toBe("setup");
    expect(hasBooted.value).toBe(true);
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

    expect(node.value).toEqual(nodeInstalled);
    expect(stage.value).toBe("home");
    expect(hasBooted.value).toBe(true);
    expect(skills.value).toBe(sampleSkills);
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

    expect(lang.value).toBe("en");
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

    expect(stage.value).toBe("setup");
    expect(hasBooted.value).toBe(true);
  });

  it("skips get_locale on a re-mount when hasBooted is already true", async () => {
    hasBooted.value = true;
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
    expect(hasBooted.value).toBe(false);
    expect(node.value).toBeNull();
  });
});
