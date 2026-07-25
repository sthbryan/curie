// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomSkillSaveResult, SkillInstallResult } from "@/components/types";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastLoadingMock = vi.fn();
const toastPromiseMock = vi.fn();

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
    loading: (...args: unknown[]) => {
      toastLoadingMock(...args);
      return "toast-id-1";
    },
    promise: (...args: unknown[]) => toastPromiseMock(...args),
  },
}));

const { useCustomActions, classifyInput } = await import(
  "@/pages/custom/hooks/useCustomActions"
);

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Result<T> = { current: T | null };
let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
const lastResult: Result<unknown> = { current: null };

function renderHook<T>(hookFn: () => T) {
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
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  toastLoadingMock.mockReset();
  toastPromiseMock.mockReset();
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

describe("classifyInput", () => {
  it("returns null for empty input", () => {
    expect(classifyInput("")).toBeNull();
    expect(classifyInput("   ")).toBeNull();
  });

  it("classifies https and http URLs", () => {
    expect(classifyInput("https://github.com/owner/repo")).toBe("url");
    expect(classifyInput("http://github.com/owner/repo")).toBe("url");
  });

  it("classifies git and ssh URLs", () => {
    expect(classifyInput("git@github.com:owner/repo.git")).toBe("url");
    expect(classifyInput("ssh://git@github.com/owner/repo")).toBe("url");
  });

  it("classifies owner/repo packages", () => {
    expect(classifyInput("owner/repo")).toBe("package");
    expect(classifyInput("owner/repo@skill")).toBe("package");
    expect(classifyInput("vercel-labs/agent-skills")).toBe("package");
  });

  it("rejects garbage", () => {
    expect(classifyInput("not a url")).toBeNull();
    expect(classifyInput("just-text")).toBeNull();
  });
});

describe("useCustomActions.install", () => {
  it("rejects input that is not a url or package", async () => {
    const { get, unmount } = renderHook(() => useCustomActions());
    await act(async () => {
      const kind = await get().install("not a valid target");
      expect(kind).toBeNull();
    });
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).not.toHaveBeenCalled();
    unmount();
  });

  it("invokes add_skill, refreshes the global skills list, and drives a toast.promise", async () => {
    invokeMock.mockResolvedValue({ package: "owner/repo", message: "ok" } as SkillInstallResult);
    const { get, unmount } = renderHook(() => useCustomActions());

    await act(async () => {
      const kind = await get().install("owner/repo@skill");
      expect(kind).toBe("package");
    });

    expect(invokeMock).toHaveBeenCalledWith("add_skill", {
      package: "owner/repo@skill",
      skillName: null,
    });
    expect(loadGlobalSkillsMock).toHaveBeenCalledWith({ checkUpdates: true });
    expect(toastPromiseMock).toHaveBeenCalledTimes(1);

    const options = toastPromiseMock.mock.calls[0][1] as {
      loading: string;
      success: () => string;
    };
    expect(options.loading).toMatch(/owner\/repo/);
    expect(options.success()).toMatch(/owner\/repo/);
    unmount();
  });

  it("forwards an optional skill name to add_skill", async () => {
    invokeMock.mockResolvedValue({ package: "x", message: "ok" } as SkillInstallResult);
    const { get, unmount } = renderHook(() => useCustomActions());

    await act(async () => {
      await get().install("owner/repo", "code-review-excellence");
    });

    expect(invokeMock).toHaveBeenCalledWith("add_skill", {
      package: "owner/repo",
      skillName: "code-review-excellence",
    });
    unmount();
  });

  it("classifies a github URL as 'url' kind", async () => {
    invokeMock.mockResolvedValue({ package: "x", message: "ok" } as SkillInstallResult);
    const { get, unmount } = renderHook(() => useCustomActions());

    await act(async () => {
      const kind = await get().install("https://github.com/owner/repo");
      expect(kind).toBe("url");
    });

    expect(invokeMock).toHaveBeenCalledWith("add_skill", {
      package: "https://github.com/owner/repo",
      skillName: null,
    });
    unmount();
  });

  it("surfaces install errors through the toast.promise error mapper and resolves to a null kind", async () => {
    invokeMock.mockRejectedValueOnce(new Error("boom"));
    const { get, unmount } = renderHook(() => useCustomActions());

    await act(async () => {
      const kind = await get().install("owner/repo");
      expect(kind).toBeNull();
    });

    expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    const options = toastPromiseMock.mock.calls[0][1] as { error: (e: unknown) => string };
    expect(options.error(new Error("boom"))).toBe("boom");
    unmount();
  });

  it("keeps the install status processing while the install runs and resets it afterwards", async () => {
    let resolveInstall: ((v: SkillInstallResult) => void) | null = null;
    invokeMock.mockReturnValueOnce(
      new Promise<SkillInstallResult>((resolve) => {
        resolveInstall = resolve;
      }),
    );
    const { get, unmount } = renderHook(() => useCustomActions());

    let pending: Promise<unknown> | null = null;
    act(() => {
      pending = get().install("owner/repo");
    });
    expect(get().installStatus.value.status).toBe("processing");

    await act(async () => {
      resolveInstall?.({ package: "owner/repo", message: "ok" } as SkillInstallResult);
      await pending;
    });
    expect(get().installStatus.value.status).toBe("idle");
    unmount();
  });
});

describe("useCustomActions.save", () => {
  it("invokes save_custom_skill, refreshes the list, and shows the installed toast when the backend reports installed", async () => {
    const saved: CustomSkillSaveResult = {
      name: "my-skill",
      path: "/Users/me/.curie/custom-skills/my-skill/SKILL.md",
      message: "Saved custom skill to /Users/me/.curie/custom-skills/my-skill",
      installed: true,
      installMessage: null,
    };
    invokeMock.mockResolvedValueOnce(saved);
    const { get, unmount } = renderHook(() => useCustomActions());

    await act(async () => {
      await get().save("my-skill", "# content");
    });

    expect(invokeMock).toHaveBeenCalledWith("save_custom_skill", {
      name: "my-skill",
      content: "# content",
    });
    expect(loadGlobalSkillsMock).toHaveBeenCalledWith({ checkUpdates: true });
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).not.toHaveBeenCalled();
    unmount();
  });

  it("does not refresh and shows a saved-toast plus install-error toast when the backend reports installed: false", async () => {
    const saved: CustomSkillSaveResult = {
      name: "my-skill",
      path: "/Users/me/.curie/custom-skills/my-skill/SKILL.md",
      message: "Saved custom skill to /Users/me/.curie/custom-skills/my-skill",
      installed: false,
      installMessage: "agent not detected",
    };
    invokeMock.mockResolvedValueOnce(saved);
    const { get, unmount } = renderHook(() => useCustomActions());

    await act(async () => {
      await get().save("my-skill", "# content");
    });

    expect(invokeMock).toHaveBeenCalledWith("save_custom_skill", {
      name: "my-skill",
      content: "# content",
    });
    expect(loadGlobalSkillsMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("surfaces save errors with a toast and rethrows", async () => {
    invokeMock.mockRejectedValueOnce("invalid name");
    const { get, unmount } = renderHook(() => useCustomActions());

    await act(async () => {
      await expect(get().save("bad name", "x")).rejects.toBe("invalid name");
    });

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("cleanSaved resets the save status", async () => {
    const { get, unmount } = renderHook(() => useCustomActions());

    act(() => {
      get().cleanSaved();
    });
    expect(get().saveStatus.value.status).toBe("idle");
    unmount();
  });
});
