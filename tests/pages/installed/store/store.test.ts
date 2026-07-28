// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillRemoveResult, SkillUpdateResult } from "@/components/types";
import {
  agentFilter,
  clearFilters,
  dismissErrors,
  query,
  QUERY_DEBOUNCE_MS,
  queryInput,
  remove,
  removeAll,
  removeError,
  removingSkill,
  setAgentFilter,
  setQuery,
  setSort,
  sortDir,
  sortKey,
  toggleUpdatesOnly,
  update,
  updateApplyError,
  updatesOnly,
  updatingSkill,
} from "@/pages/installed/store/store";

const invokeMock = vi.fn();
const loadSkillsMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));
vi.mock("@/lib/boot", () => ({
  loadSkills: (...args: unknown[]) => loadSkillsMock(...args),
}));

beforeEach(() => {
  invokeMock.mockReset();
  loadSkillsMock.mockReset();
  loadSkillsMock.mockResolvedValue(undefined);
  updatingSkill.value = null;
  updateApplyError.value = null;
  removingSkill.value = null;
  removeError.value = null;
  queryInput.value = "";
  query.value = "";
  sortKey.value = "updated";
  sortDir.value = "desc";
  agentFilter.value = null;
  updatesOnly.value = false;
});

describe("InstalledActions", () => {
  it("starts with no in-flight action and no errors", () => {
    expect(updatingSkill.value).toBeNull();
    expect(updateApplyError.value).toBeNull();
    expect(removingSkill.value).toBeNull();
    expect(removeError.value).toBeNull();
  });

  it("update() with no names invokes update_skills with null and refreshes", async () => {
    const result: SkillUpdateResult = { updated: ["a"], message: "ok" };
    invokeMock.mockResolvedValue(result);

    await update();

    expect(invokeMock).toHaveBeenCalledWith("update_skills", { skills: null });
    expect(loadSkillsMock).toHaveBeenCalledWith(null, { checkUpdates: true });
    expect(updatingSkill.value).toBeNull();
    expect(updateApplyError.value).toBeNull();
  });

  it("update() with a single name tags updatingSkill with the name and rethrows on failure", async () => {
    invokeMock.mockRejectedValueOnce(new Error("network down"));

    await expect(update(["only-one"])).rejects.toThrow("network down");

    expect(invokeMock).toHaveBeenCalledWith("update_skills", { skills: ["only-one"] });
    expect(updatingSkill.value).toBeNull();
    expect(updateApplyError.value).toBe("network down");
  });

  it("update() with multiple names shows '*' as the in-flight tag", async () => {
    invokeMock.mockResolvedValue({ updated: [], message: "ok" });
    const promise = update(["a", "b"]);
    expect(updatingSkill.value).toBe("*");
    await promise;
    expect(updatingSkill.value).toBeNull();
  });

  it("update() captures a plain string rejection message", async () => {
    invokeMock.mockRejectedValueOnce("plain failure");
    await update().catch(() => {});
    expect(updateApplyError.value).toBe("plain failure");
  });

  it("remove() with one name shows the name and refreshes on success", async () => {
    const result: SkillRemoveResult = { removed: ["only"], message: "ok" };
    invokeMock.mockResolvedValue(result);

    await remove(["only"]);

    expect(invokeMock).toHaveBeenCalledWith("remove_skills", { skills: ["only"] });
    expect(loadSkillsMock).toHaveBeenCalled();
    expect(removingSkill.value).toBeNull();
  });

  it("remove() with multiple names shows '*'", async () => {
    invokeMock.mockResolvedValue({ removed: ["a", "b"], message: "ok" });
    const promise = remove(["a", "b"]);
    expect(removingSkill.value).toBe("*");
    await promise;
  });

  it("remove() with empty names is a no-op", async () => {
    await remove([]);
    expect(invokeMock).not.toHaveBeenCalled();
    expect(loadSkillsMock).not.toHaveBeenCalled();
  });

  it("remove() surfaces a failure and rethrows", async () => {
    invokeMock.mockRejectedValueOnce(new Error("rm failed"));
    await expect(remove(["x"])).rejects.toThrow("rm failed");
    expect(removeError.value).toBe("rm failed");
    expect(removingSkill.value).toBeNull();
  });

  it("dismissErrors clears both error fields", async () => {
    invokeMock.mockRejectedValueOnce("upd-err").mockRejectedValueOnce("rm-err");
    await update().catch(() => {});
    await remove(["x"]).catch(() => {});
    expect(updateApplyError.value).toBe("upd-err");
    expect(removeError.value).toBe("rm-err");

    dismissErrors();
    expect(updateApplyError.value).toBeNull();
    expect(removeError.value).toBeNull();
  });
});

describe("filters", () => {
  it("starts empty", () => {
    expect(queryInput.value).toBe("");
    expect(query.value).toBe("");
    expect(agentFilter.value).toBeNull();
    expect(updatesOnly.value).toBe(false);
  });

  it("shows the typed query at once but defers the one that filters", () => {
    vi.useFakeTimers();
    setQuery("hello");
    expect(queryInput.value).toBe("hello");
    expect(query.value).toBe("");

    vi.advanceTimersByTime(QUERY_DEBOUNCE_MS);
    expect(query.value).toBe("hello");
    vi.useRealTimers();
  });

  it("only commits the last keystroke of a burst", () => {
    vi.useFakeTimers();
    setQuery("a");
    vi.advanceTimersByTime(50);
    setQuery("ab");
    vi.advanceTimersByTime(50);
    setQuery("abc");
    expect(query.value).toBe("");

    vi.advanceTimersByTime(QUERY_DEBOUNCE_MS);
    expect(query.value).toBe("abc");
    vi.useRealTimers();
  });

  it("setAgentFilter updates the agent filter", () => {
    setAgentFilter("Claude Code");
    expect(agentFilter.value).toBe("Claude Code");
    setAgentFilter(null);
    expect(agentFilter.value).toBeNull();
  });

  it("keeps the tool filter when toggling updates so the two combine", () => {
    setAgentFilter("Claude Code");
    toggleUpdatesOnly();
    expect(updatesOnly.value).toBe(true);
    expect(agentFilter.value).toBe("Claude Code");

    toggleUpdatesOnly();
    expect(updatesOnly.value).toBe(false);
  });

  it("clearFilters resets every filter including the query", () => {
    vi.useFakeTimers();
    setQuery("foo");
    setAgentFilter("Codex");
    toggleUpdatesOnly();

    clearFilters();
    expect(queryInput.value).toBe("");
    expect(query.value).toBe("");
    expect(agentFilter.value).toBeNull();
    expect(updatesOnly.value).toBe(false);

    vi.advanceTimersByTime(QUERY_DEBOUNCE_MS);
    expect(query.value).toBe("");
    vi.useRealTimers();
  });
});

describe("sort", () => {
  it("starts on the newest first", () => {
    expect(sortKey.value).toBe("updated");
    expect(sortDir.value).toBe("desc");
  });

  it("flips the direction when the same column is picked again", () => {
    setSort("updated");
    expect(sortDir.value).toBe("asc");
    setSort("updated");
    expect(sortDir.value).toBe("desc");
  });

  it("opens text columns ascending and date columns descending", () => {
    setSort("name");
    expect(sortKey.value).toBe("name");
    expect(sortDir.value).toBe("asc");

    setSort("source");
    expect(sortDir.value).toBe("asc");

    setSort("updated");
    expect(sortDir.value).toBe("desc");

    setSort("agents");
    expect(sortDir.value).toBe("desc");
  });
});

describe("removeAll", () => {
  it("wipes every skill, clears the filters and reloads", async () => {
    setQuery("foo");
    setAgentFilter("Codex");
    invokeMock.mockResolvedValueOnce({ removed: [], message: "gone" });

    await removeAll();

    expect(invokeMock).toHaveBeenCalledWith("remove_all_skills");
    expect(queryInput.value).toBe("");
    expect(agentFilter.value).toBeNull();
    expect(removingSkill.value).toBeNull();
    expect(loadSkillsMock).toHaveBeenCalled();
  });

  it("keeps the failure in the banner and rethrows", async () => {
    invokeMock.mockRejectedValueOnce("nope");
    await expect(removeAll()).rejects.toBe("nope");
    expect(removeError.value).toBe("nope");
    expect(removingSkill.value).toBeNull();
  });
});
