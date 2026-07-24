// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomSkillSaveResult, SkillInstallResult } from "@/components/types";

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

  it("invokes add_skill and refreshes the global skills list", async () => {
    invokeMock.mockResolvedValue({ package: "owner/repo", message: "ok" } as SkillInstallResult);
    const { get, unmount } = renderHook(() => useCustomActions());

    await act(async () => {
      const kind = await get().install("owner/repo@skill");
      expect(kind).toBe("package");
    });

    expect(invokeMock).toHaveBeenCalledWith("add_skill", { package: "owner/repo@skill" });
    expect(loadGlobalSkillsMock).toHaveBeenCalledWith({ checkUpdates: true });
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
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
    });
    unmount();
  });

  it("surfaces install errors and clears the success state", async () => {
    invokeMock.mockRejectedValueOnce(new Error("boom"));
    const { get, unmount } = renderHook(() => useCustomActions());

    await act(async () => {
      const kind = await get().install("owner/repo");
      expect(kind).toBeNull();
    });

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    unmount();
  });
});

describe("useCustomActions.save", () => {
  it("invokes save_custom_skill and shows a success toast", async () => {
    const saved: CustomSkillSaveResult = {
      name: "my-skill",
      path: "/Users/me/.curie/custom-skills/my-skill/SKILL.md",
      message: "Saved",
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
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
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
