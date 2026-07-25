// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillInstallResult } from "@/components/types";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn();
const toastErrorMock = vi.fn();
const toastPromiseMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    promise: (...args: unknown[]) => toastPromiseMock(...args),
  },
}));

const { useSkillInstall } = await import("@/pages/custom/hooks/useSkillInstall");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
const lastResult: { current: ReturnType<typeof useSkillInstall> | null } = { current: null };

function mount() {
  function Probe() {
    lastResult.current = useSkillInstall();
    return null;
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
  });
}

function get(): ReturnType<typeof useSkillInstall> {
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

function promiseOptions() {
  return toastPromiseMock.mock.calls[0][1] as {
    loading: string;
    success: () => string;
    error: (e: unknown) => string;
  };
}

beforeEach(() => {
  invokeMock.mockReset();
  loadGlobalSkillsMock.mockReset();
  loadGlobalSkillsMock.mockResolvedValue(undefined);
  toastErrorMock.mockReset();
  toastPromiseMock.mockReset();
  mount();
});

afterEach(unmount);

describe("useSkillInstall", () => {
  it("rejects input that is not a URL or package without touching the backend", async () => {
    await act(async () => {
      expect(await get().install("not a valid target")).toBe(false);
    });

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).not.toHaveBeenCalled();
    expect(toastPromiseMock).not.toHaveBeenCalled();
  });

  it("installs the target, refreshes the global skills list, and drives a toast.promise", async () => {
    invokeMock.mockResolvedValue({ package: "owner/repo", message: "ok" } as SkillInstallResult);

    await act(async () => {
      expect(await get().install("owner/repo@skill")).toBe(true);
    });

    expect(invokeMock).toHaveBeenCalledWith("add_skill", {
      package: "owner/repo@skill",
      skillName: null,
    });
    expect(loadGlobalSkillsMock).toHaveBeenCalledWith({ checkUpdates: true });
    expect(toastPromiseMock).toHaveBeenCalledTimes(1);
    expect(promiseOptions().loading).toMatch(/owner\/repo/);
    expect(promiseOptions().success()).toMatch(/owner\/repo/);
  });

  it("accepts a full github URL", async () => {
    invokeMock.mockResolvedValue({ package: "x", message: "ok" } as SkillInstallResult);

    await act(async () => {
      expect(await get().install("https://github.com/owner/repo")).toBe(true);
    });

    expect(invokeMock).toHaveBeenCalledWith("add_skill", {
      package: "https://github.com/owner/repo",
      skillName: null,
    });
  });

  it("resolves to false and maps the error for the toast when the install fails", async () => {
    invokeMock.mockRejectedValueOnce(new Error("boom"));

    await act(async () => {
      expect(await get().install("owner/repo")).toBe(false);
    });

    expect(promiseOptions().error(new Error("boom"))).toBe("boom");
  });

  it("flags installing while the backend is working and clears it afterwards", async () => {
    let resolveInstall: ((v: SkillInstallResult) => void) | null = null;
    invokeMock.mockReturnValueOnce(
      new Promise<SkillInstallResult>((resolve) => {
        resolveInstall = resolve;
      }),
    );

    let pending: Promise<boolean> | null = null;
    act(() => {
      pending = get().install("owner/repo");
    });
    expect(get().installing).toBe(true);

    await act(async () => {
      resolveInstall?.({ package: "owner/repo", message: "ok" } as SkillInstallResult);
      await pending;
    });
    expect(get().installing).toBe(false);
  });
});
