// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomSkillSaveResult } from "@/components/types";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const { useSkillSave } = await import("@/pages/custom/hooks/useSkillSave");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
const lastResult: { current: ReturnType<typeof useSkillSave> | null } = { current: null };

function mount() {
  function Probe() {
    lastResult.current = useSkillSave();
    return null;
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
  });
}

function get(): ReturnType<typeof useSkillSave> {
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

const saved: CustomSkillSaveResult = {
  name: "my-skill",
  path: "/Users/me/.curie/custom-skills/my-skill/SKILL.md",
  message: "Saved custom skill",
  installed: true,
  installMessage: null,
};

beforeEach(() => {
  invokeMock.mockReset();
  loadGlobalSkillsMock.mockReset();
  loadGlobalSkillsMock.mockResolvedValue(undefined);
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  mount();
});

afterEach(unmount);

describe("useSkillSave", () => {
  it("saves, refreshes the list, and reports success when the backend installed the skill", async () => {
    invokeMock.mockResolvedValueOnce(saved);

    await act(async () => {
      expect(await get().save("my-skill", "# content")).toBe(true);
    });

    expect(invokeMock).toHaveBeenCalledWith("save_custom_skill", {
      name: "my-skill",
      content: "# content",
    });
    expect(loadGlobalSkillsMock).toHaveBeenCalledWith({ checkUpdates: true });
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("reports the saved path plus the install failure when the backend could not install", async () => {
    invokeMock.mockResolvedValueOnce({
      ...saved,
      installed: false,
      installMessage: "agent not detected",
    });

    await act(async () => {
      expect(await get().save("my-skill", "# content")).toBe(true);
    });

    expect(loadGlobalSkillsMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
  });

  it("resolves to false and reports the error when the save fails", async () => {
    invokeMock.mockRejectedValueOnce("invalid name");

    await act(async () => {
      expect(await get().save("bad name", "x")).toBe(false);
    });

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock.mock.calls[0][0]).toBe("invalid name");
  });

  it("flags saving while the backend is working and clears it afterwards", async () => {
    let resolveSave: ((v: CustomSkillSaveResult) => void) | null = null;
    invokeMock.mockReturnValueOnce(
      new Promise<CustomSkillSaveResult>((resolve) => {
        resolveSave = resolve;
      }),
    );

    let pending: Promise<boolean> | null = null;
    act(() => {
      pending = get().save("my-skill", "# content");
    });
    expect(get().saving).toBe(true);

    await act(async () => {
      resolveSave?.(saved);
      await pending;
    });
    expect(get().saving).toBe(false);
  });
});
