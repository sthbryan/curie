// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillInstallResult } from "@/components/types";

const invokeMock = vi.fn();
const loadSkillsMock = vi.fn();
const toastErrorMock = vi.fn();
const promiseToastMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadSkills: (...args: unknown[]) => loadSkillsMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/lib/toast", () => ({
  promiseToast: (...args: unknown[]) => promiseToastMock(...args),
}));

const { useRemoteInstall } = await import("@/pages/custom/hooks/useRemoteInstall");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
const lastResult: { current: ReturnType<typeof useRemoteInstall> | null } = { current: null };

function mount() {
  function Probe() {
    lastResult.current = useRemoteInstall();
    return null;
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Probe />);
  });
}

function get(): ReturnType<typeof useRemoteInstall> {
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
  toastErrorMock.mockReset();
  promiseToastMock.mockReset();
  mount();
});

afterEach(unmount);

describe("useRemoteInstall", () => {
  it("rejects input that is not a URL or package without touching the backend", async () => {
    await act(async () => {
      expect(await get().install("not a valid target")).toBe(false);
    });

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).not.toHaveBeenCalled();
    expect(promiseToastMock).not.toHaveBeenCalled();
  });

  it("installs the target, refreshes the global skills list, and drives a toast.promise", async () => {
    invokeMock.mockResolvedValue({ package: "owner/repo", message: "ok" } as SkillInstallResult);

    await act(async () => {
      expect(await get().install("owner/repo@skill")).toBe(true);
    });

    expect(invokeMock).toHaveBeenCalledWith("add_skill", {
      package: "owner/repo@skill",
      skillName: null,
      projectPath: null,
    });
    expect(loadSkillsMock).toHaveBeenCalledWith(null, { checkUpdates: true });
    expect(promiseToastMock).toHaveBeenCalledTimes(1);
    expect(toastCopy().loading.detail).toBe("owner/repo · skill");
    expect(toastCopy().success.detail).toBe("owner/repo · skill");
  });

  it("accepts a full github URL", async () => {
    invokeMock.mockResolvedValue({ package: "x", message: "ok" } as SkillInstallResult);

    await act(async () => {
      expect(await get().install("https://github.com/owner/repo")).toBe(true);
    });

    expect(invokeMock).toHaveBeenCalledWith("add_skill", {
      package: "https://github.com/owner/repo",
      skillName: null,
      projectPath: null,
    });
  });

  it("resolves to false and maps the error for the toast when the install fails", async () => {
    invokeMock.mockRejectedValueOnce(new Error("boom"));

    await act(async () => {
      expect(await get().install("owner/repo")).toBe(false);
    });

    expect(toastCopy().error(new Error("boom")).detail).toBe("boom");
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
