// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillRemoveResult, SkillUpdateResult } from "@/components/types";
import { useSkillsStore } from "@/store/skills";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

const { useSkillActions } = await import("./useSkillActions");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Result<T> = { current: T | null };
let root: Root | null = null;
let container: HTMLDivElement | null = null;
const lastResult: Result<unknown> = { current: null };

function renderHook<T>(hookFn: () => T): {
  get: () => T;
  rerender: () => void;
  unmount: () => void;
} {
  function Probe() {
    lastResult.current = hookFn() as unknown;
    return null;
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
  });
  return {
    get: () => lastResult.current as T,
    rerender: () =>
      act(() => {
        root?.render(<Probe />);
      }),
    unmount: () => {
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
    },
  };
}

beforeEach(() => {
  invokeMock.mockReset();
  loadGlobalSkillsMock.mockReset();
  loadGlobalSkillsMock.mockResolvedValue(undefined);
  useSkillsStore.setState({
    skills: [],
    skillsLoading: false,
    skillsError: null,
    skillUpdates: [],
    updatesLoading: false,
    updatesError: null,
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

describe("useSkillActions", () => {
  it("starts with no in-flight action and no errors", () => {
    const { get, unmount } = renderHook(() => useSkillActions());
    const a = get();
    expect(a.updatingSkill).toBeNull();
    expect(a.updateApplyError).toBeNull();
    expect(a.removingSkill).toBeNull();
    expect(a.removeError).toBeNull();
    unmount();
  });

  it("update() with no names invokes update_skills with null and refreshes", async () => {
    const result: SkillUpdateResult = { updated: ["a"], message: "ok" };
    invokeMock.mockResolvedValue(result);

    const { get, unmount } = renderHook(() => useSkillActions());
    await act(async () => {
      await get().update();
    });

    expect(invokeMock).toHaveBeenCalledWith("update_skills", { skills: null });
    expect(loadGlobalSkillsMock).toHaveBeenCalledWith({ checkUpdates: true });
    expect(get().updatingSkill).toBeNull();
    expect(get().updateApplyError).toBeNull();
    unmount();
  });

  it("update() with a single name tags updatingSkill with the name and rethrows on failure", async () => {
    invokeMock.mockRejectedValueOnce(new Error("network down"));

    const { get, unmount } = renderHook(() => useSkillActions());
    await act(async () => {
      await expect(get().update(["only-one"])).rejects.toThrow("network down");
    });

    expect(invokeMock).toHaveBeenCalledWith("update_skills", { skills: ["only-one"] });
    expect(get().updatingSkill).toBeNull();
    expect(get().updateApplyError).toBe("network down");
    unmount();
  });

  it("update() with multiple names shows '*' as the in-flight tag", async () => {
    invokeMock.mockResolvedValue({ updated: [], message: "ok" });
    const { get, unmount } = renderHook(() => useSkillActions());

    let promise: Promise<void>;
    act(() => {
      promise = get().update(["a", "b"]);
    });
    expect(get().updatingSkill).toBe("*");
    await act(async () => {
      await promise;
    });
    expect(get().updatingSkill).toBeNull();
    unmount();
  });

  it("update() captures a plain string rejection message", async () => {
    invokeMock.mockRejectedValueOnce("plain failure");
    const { get, unmount } = renderHook(() => useSkillActions());

    await act(async () => {
      await get()
        .update()
        .catch(() => {});
    });

    expect(get().updateApplyError).toBe("plain failure");
    unmount();
  });

  it("remove() with one name shows the name and refreshes on success", async () => {
    const result: SkillRemoveResult = { removed: ["only"], message: "ok" };
    invokeMock.mockResolvedValue(result);

    const { get, unmount } = renderHook(() => useSkillActions());
    await act(async () => {
      await get().remove(["only"]);
    });

    expect(invokeMock).toHaveBeenCalledWith("remove_skills", { skills: ["only"] });
    expect(loadGlobalSkillsMock).toHaveBeenCalled();
    expect(get().removingSkill).toBeNull();
    unmount();
  });

  it("remove() with multiple names shows '*'", async () => {
    invokeMock.mockResolvedValue({ removed: ["a", "b"], message: "ok" });
    const { get, unmount } = renderHook(() => useSkillActions());

    let promise: Promise<void>;
    act(() => {
      promise = get().remove(["a", "b"]);
    });
    expect(get().removingSkill).toBe("*");
    await act(async () => {
      await promise;
    });
    unmount();
  });

  it("remove() with empty names is a no-op", async () => {
    const { get, unmount } = renderHook(() => useSkillActions());
    await act(async () => {
      await get().remove([]);
    });
    expect(invokeMock).not.toHaveBeenCalled();
    expect(loadGlobalSkillsMock).not.toHaveBeenCalled();
    unmount();
  });

  it("remove() surfaces a failure and rethrows", async () => {
    invokeMock.mockRejectedValueOnce(new Error("rm failed"));
    const { get, unmount } = renderHook(() => useSkillActions());

    await act(async () => {
      await expect(get().remove(["x"])).rejects.toThrow("rm failed");
    });

    expect(get().removeError).toBe("rm failed");
    expect(get().removingSkill).toBeNull();
    unmount();
  });

  it("dismissErrors clears both error fields", async () => {
    invokeMock.mockRejectedValueOnce("upd-err").mockRejectedValueOnce("rm-err");

    const { get, unmount } = renderHook(() => useSkillActions());
    await act(async () => {
      await get()
        .update()
        .catch(() => {});
    });
    await act(async () => {
      await get()
        .remove(["x"])
        .catch(() => {});
    });
    expect(get().updateApplyError).toBe("upd-err");
    expect(get().removeError).toBe("rm-err");

    act(() => {
      get().dismissErrors();
    });
    expect(get().updateApplyError).toBeNull();
    expect(get().removeError).toBeNull();
    unmount();
  });
});
