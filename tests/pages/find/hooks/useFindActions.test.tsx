// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillSearchResult } from "@/components/types";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

const { useFindActions } = await import("@/pages/find/hooks/useFindActions");

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

const sampleResult: SkillSearchResult = {
  id: "1",
  name: "impeccable",
  source: "pbakaus/impeccable",
  installs: 1234,
  package: "pbakaus/impeccable",
  url: "https://example.com/impeccable",
};

describe("useFindActions", () => {
  it("starts with empty results and no error/loading state", () => {
    const { get, unmount } = renderHook(() => useFindActions());
    const a = get();
    expect(a.results).toEqual([]);
    expect(a.loading).toBe(false);
    expect(a.error).toBeNull();
    expect(a.installing).toBeNull();
    expect(a.installError).toBeNull();
    unmount();
  });

  it("search() with query < 2 chars clears results and skips the invoke", async () => {
    const { get, unmount } = renderHook(() => useFindActions());
    await act(async () => {
      await get().search("a", "");
    });
    expect(invokeMock).not.toHaveBeenCalled();
    expect(get().results).toEqual([]);
    expect(get().loading).toBe(false);
    unmount();
  });

  it("search() with a valid query stores the results", async () => {
    invokeMock.mockResolvedValue([sampleResult]);
    const { get, unmount } = renderHook(() => useFindActions());

    await act(async () => {
      await get().search("impeccable", "pbakaus");
    });

    expect(invokeMock).toHaveBeenCalledWith("find_skills", {
      query: "impeccable",
      owner: "pbakaus",
    });
    expect(get().results).toEqual([sampleResult]);
    expect(get().loading).toBe(false);
    expect(get().error).toBeNull();
    unmount();
  });

  it("search() treats an empty owner as null", async () => {
    invokeMock.mockResolvedValue([]);
    const { get, unmount } = renderHook(() => useFindActions());
    await act(async () => {
      await get().search("impeccable", "  ");
    });
    expect(invokeMock).toHaveBeenCalledWith("find_skills", {
      query: "impeccable",
      owner: null,
    });
    unmount();
  });

  it("search() trims whitespace from the query", async () => {
    invokeMock.mockResolvedValue([]);
    const { get, unmount } = renderHook(() => useFindActions());
    await act(async () => {
      await get().search("  impeccable  ", "");
    });
    expect(invokeMock).toHaveBeenCalledWith("find_skills", {
      query: "impeccable",
      owner: null,
    });
    unmount();
  });

  it("search() surfaces an error and clears results", async () => {
    invokeMock.mockRejectedValueOnce(new Error("not found"));
    const { get, unmount } = renderHook(() => useFindActions());

    await act(async () => {
      await get().search("missing-pkg", "");
    });

    expect(get().error).toBe("not found");
    expect(get().results).toEqual([]);
    expect(get().loading).toBe(false);
    unmount();
  });

  it("search() ignores stale responses from earlier in-flight requests", async () => {
    type Resolver = (value: unknown) => void;
    const resolvers: Resolver[] = [];
    invokeMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve as Resolver);
        }),
    );

    const { get, unmount } = renderHook(() => useFindActions());

    let first: Promise<void>;
    let second: Promise<void>;
    act(() => {
      first = get().search("first-query", "");
    });
    act(() => {
      second = get().search("second-query", "");
    });

    // Resolve the second one first, then the first one — first should be ignored.
    resolvers[1]?.([sampleResult]);
    resolvers[0]?.([]);

    await act(async () => {
      await Promise.all([first, second]);
    });

    expect(get().results).toEqual([sampleResult]);
    unmount();
  });

  it("install() invokes add_skill and refreshes the skills list", async () => {
    invokeMock.mockResolvedValue({ package: "x", message: "ok" });
    const { get, unmount } = renderHook(() => useFindActions());

    await act(async () => {
      await get().install("x");
    });

    expect(invokeMock).toHaveBeenCalledWith("add_skill", { package: "x" });
    expect(loadGlobalSkillsMock).toHaveBeenCalledWith({ checkUpdates: true });
    expect(get().installing).toBeNull();
    unmount();
  });

  it("install() surfaces the rejection and rethrows", async () => {
    invokeMock.mockRejectedValueOnce("install failed");
    const { get, unmount } = renderHook(() => useFindActions());

    await act(async () => {
      await expect(get().install("bad")).rejects.toBe("install failed");
    });

    expect(get().installError).toBe("install failed");
    expect(get().installing).toBeNull();
    unmount();
  });

  it("dismissInstallError clears installError only", async () => {
    invokeMock.mockRejectedValueOnce("install failed");
    const { get, unmount } = renderHook(() => useFindActions());
    await act(async () => {
      await get()
        .install("x")
        .catch(() => {});
    });
    expect(get().installError).toBe("install failed");

    act(() => {
      get().dismissInstallError();
    });
    expect(get().installError).toBeNull();
    unmount();
  });
});
