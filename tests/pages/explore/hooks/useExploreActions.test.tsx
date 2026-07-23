// @vitest-environment happy-dom

import { createRoot } from "preact/compat/client";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExplorePage, SkillExploreResult } from "@/components/types";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

const { useExploreActions } = await import("./useExploreActions");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
const lastResult: { current: unknown } = { current: null };

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

const sample: SkillExploreResult = {
  id: "1",
  name: "impeccable",
  source: "pbakaus/impeccable",
  installs: 1234,
  package: "pbakaus/impeccable",
  url: "https://example.com/impeccable",
  installsYesterday: 10,
  change: 0.05,
  isOfficial: false,
};

function page(
  partial: Partial<ExplorePage> = {},
  skills: SkillExploreResult[] = [sample],
): ExplorePage {
  return {
    skills,
    total: skills.length,
    hasMore: false,
    page: 0,
    view: "hot",
    ...partial,
  };
}

describe("useExploreActions", () => {
  it("starts in the requested view with empty state", () => {
    const { get, unmount } = renderHook(() => useExploreActions("trending"));
    const a = get();
    expect(a.view).toBe("trending");
    expect(a.skills).toEqual([]);
    expect(a.total).toBe(0);
    expect(a.hasMore).toBe(false);
    expect(a.loading).toBe(false);
    expect(a.loadingMore).toBe(false);
    expect(a.error).toBeNull();
    expect(a.installing).toBeNull();
    expect(a.installError).toBeNull();
    unmount();
  });

  it("load() fetches the first page for the given view", async () => {
    invokeMock.mockResolvedValue(page({ view: "hot" }, [sample]));
    const { get, unmount } = renderHook(() => useExploreActions());
    await act(async () => {
      await get().load("hot");
    });

    expect(invokeMock).toHaveBeenCalledWith("explore_skills", { view: "hot", page: 0 });
    expect(get().skills).toEqual([sample]);
    expect(get().total).toBe(1);
    expect(get().loading).toBe(false);
    unmount();
  });

  it("load() uses the current view when no view is passed", async () => {
    invokeMock.mockResolvedValue(page({ view: "trending" }));
    const { get, unmount } = renderHook(() => useExploreActions("trending"));
    await act(async () => {
      await get().load();
    });
    expect(invokeMock).toHaveBeenCalledWith("explore_skills", { view: "trending", page: 0 });
    unmount();
  });

  it("load() surfaces an error and resets the data", async () => {
    invokeMock.mockResolvedValueOnce(page());
    const { get, unmount } = renderHook(() => useExploreActions());

    await act(async () => {
      await get().load("hot");
    });
    expect(get().skills).toHaveLength(1);

    invokeMock.mockRejectedValueOnce(new Error("network down"));
    await act(async () => {
      await get().load("trending");
    });

    expect(get().error).toBe("network down");
    expect(get().skills).toEqual([]);
    expect(get().total).toBe(0);
    expect(get().hasMore).toBe(false);
    unmount();
  });

  it("load() ignores stale responses from earlier in-flight requests", async () => {
    type Resolver = (value: unknown) => void;
    const resolvers: Resolver[] = [];
    invokeMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve as Resolver);
        }),
    );

    const { get, unmount } = renderHook(() => useExploreActions());

    let first: Promise<void>;
    let second: Promise<void>;
    act(() => {
      first = get().load("hot");
    });
    act(() => {
      second = get().load("trending");
    });

    // Second should win, first should be ignored.
    resolvers[1]?.(page({ view: "trending" }, [sample]));
    resolvers[0]?.(page({ view: "hot" }, []));
    await act(async () => {
      await Promise.all([first, second]);
    });

    expect(get().skills).toEqual([sample]);
    expect(get().total).toBe(1);
    unmount();
  });

  it("setView() updates the view and triggers a load", async () => {
    invokeMock.mockResolvedValue(page({ view: "all-time" }));
    const { get, unmount } = renderHook(() => useExploreActions("hot"));

    await act(async () => {
      get().setView("all-time");
    });

    expect(get().view).toBe("all-time");
    expect(invokeMock).toHaveBeenCalledWith("explore_skills", { view: "all-time", page: 0 });
    unmount();
  });

  it("loadMore() appends the next page when hasMore is true", async () => {
    const first: SkillExploreResult = { ...sample, id: "1", name: "first" };
    const second: SkillExploreResult = { ...sample, id: "2", name: "second" };

    invokeMock
      .mockResolvedValueOnce({ ...page({ hasMore: true, page: 0 }), skills: [first] })
      .mockResolvedValueOnce({ ...page({ hasMore: false, page: 1 }), skills: [second] });

    const { get, unmount } = renderHook(() => useExploreActions());
    await act(async () => {
      await get().load("hot");
    });
    expect(get().hasMore).toBe(true);
    expect(get().skills).toEqual([first]);

    await act(async () => {
      await get().loadMore();
    });

    expect(invokeMock).toHaveBeenLastCalledWith("explore_skills", { view: "hot", page: 1 });
    expect(get().skills).toEqual([first, second]);
    expect(get().hasMore).toBe(false);
    unmount();
  });

  it("loadMore() is a no-op when hasMore is false", async () => {
    invokeMock.mockResolvedValue(page({ hasMore: false }));
    const { get, unmount } = renderHook(() => useExploreActions());
    await act(async () => {
      await get().load("hot");
    });
    invokeMock.mockClear();

    await act(async () => {
      await get().loadMore();
    });
    expect(invokeMock).not.toHaveBeenCalled();
    unmount();
  });

  it("install() invokes add_skill and refreshes", async () => {
    invokeMock.mockResolvedValueOnce(page()).mockResolvedValueOnce({
      package: "x",
      message: "ok",
    });

    const { get, unmount } = renderHook(() => useExploreActions());
    await act(async () => {
      await get().load("hot");
    });

    await act(async () => {
      await get().install("x");
    });
    expect(loadGlobalSkillsMock).toHaveBeenCalledWith({ checkUpdates: true });
    expect(get().installing).toBeNull();
    unmount();
  });

  it("install() surfaces the rejection and rethrows", async () => {
    invokeMock.mockRejectedValueOnce("install failed");
    const { get, unmount } = renderHook(() => useExploreActions());

    await act(async () => {
      await expect(get().install("bad")).rejects.toBe("install failed");
    });

    expect(get().installError).toBe("install failed");
    expect(get().installing).toBeNull();
    unmount();
  });

  it("dismissInstallError clears the install error", async () => {
    invokeMock.mockRejectedValueOnce("install failed");
    const { get, unmount } = renderHook(() => useExploreActions());
    await act(async () => {
      await get()
        .install("x")
        .catch(() => {});
    });
    act(() => {
      get().dismissInstallError();
    });
    expect(get().installError).toBeNull();
    unmount();
  });
});
