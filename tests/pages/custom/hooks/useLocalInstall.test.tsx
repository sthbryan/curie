// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomSkillInstallResult } from "@/components/types";

const invokeMock = vi.fn();
const loadSkillsMock = vi.fn();
const promiseToastMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadSkills: (...args: unknown[]) => loadSkillsMock(...args),
}));

vi.mock("@/lib/toast", () => ({
  promiseToast: (...args: unknown[]) => promiseToastMock(...args),
}));

const { useLocalInstall } = await import("@/pages/custom/hooks/useLocalInstall");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
const lastResult: { current: ReturnType<typeof useLocalInstall> | null } = { current: null };

function mount() {
  function Probe() {
    lastResult.current = useLocalInstall();
    return null;
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
  });
}

function get(): ReturnType<typeof useLocalInstall> {
  if (!lastResult.current) throw new Error("hook not mounted");
  return lastResult.current;
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
  lastResult.current = null;
}

const installed: CustomSkillInstallResult = {
  name: "my-skill",
  path: "/Users/me/.curie/custom-skills/my-skill/SKILL.md",
  message: "Installed custom skill",
};

function toastCopy() {
  return promiseToastMock.mock.calls[0][1] as {
    loading: { label: string; detail?: string };
    success: { label: string; detail?: string };
    error: (e: unknown) => { label: string; detail?: string };
  };
}

beforeEach(() => {
  invokeMock.mockReset();
  loadSkillsMock.mockReset();
  loadSkillsMock.mockResolvedValue(undefined);
  promiseToastMock.mockReset();
  mount();
});

afterEach(unmount);

describe("useLocalInstall", () => {
  it("installs the content and refreshes the global skills list", async () => {
    invokeMock.mockResolvedValueOnce(installed);

    await act(async () => {
      expect(await get().install("my-skill", "# content")).toBe(true);
    });

    expect(invokeMock).toHaveBeenCalledWith("install_custom_skill", {
      name: "my-skill",
      content: "# content",
    });
    expect(loadSkillsMock).toHaveBeenCalledWith(null, { checkUpdates: true });
  });

  it("drives one toast for the whole install", async () => {
    invokeMock.mockResolvedValueOnce(installed);

    await act(async () => {
      await get().install("my-skill", "# content");
    });

    expect(promiseToastMock).toHaveBeenCalledTimes(1);
    expect(toastCopy().loading.detail).toBe("my-skill");
    expect(toastCopy().success.detail).toBe("my-skill");
  });

  it("resolves to false and maps the backend reason into the same toast", async () => {
    invokeMock.mockRejectedValueOnce(
      "missing required frontmatter field(s): name, description",
    );

    await act(async () => {
      expect(await get().install("my-skill", "# content")).toBe(false);
    });

    expect(loadSkillsMock).not.toHaveBeenCalled();
    expect(promiseToastMock).toHaveBeenCalledTimes(1);
    expect(toastCopy().error("missing required frontmatter field(s): name, description").detail).toContain(
      "missing required frontmatter",
    );
  });

  it("flags installing while the backend is working and clears it afterwards", async () => {
    let resolveInstall: ((v: CustomSkillInstallResult) => void) | null = null;
    invokeMock.mockReturnValueOnce(
      new Promise<CustomSkillInstallResult>((resolve) => {
        resolveInstall = resolve;
      }),
    );

    let pending: Promise<boolean> | null = null;
    act(() => {
      pending = get().install("my-skill", "# content");
    });
    expect(get().installing).toBe(true);

    await act(async () => {
      resolveInstall?.(installed);
      await pending;
    });
    expect(get().installing).toBe(false);
  });
});
