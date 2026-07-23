// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillRemoveResult, SkillUpdateResult } from "@/components/types";
import {
  agentFilter,
  clearFilters,
  dismissErrors,
  query,
  remove,
  removeError,
  removingSkill,
  setAgentFilter,
  setQuery,
  toggleUpdatesOnly,
  update,
  updateApplyError,
  updatesOnly,
  updatingSkill,
} from "./store";

const invokeMock = vi.fn();
const loadGlobalSkillsMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));
vi.mock("@/lib/boot", () => ({
  loadGlobalSkills: (...args: unknown[]) => loadGlobalSkillsMock(...args),
}));

beforeEach(() => {
  invokeMock.mockReset();
  loadGlobalSkillsMock.mockReset();
  loadGlobalSkillsMock.mockResolvedValue(undefined);
  updatingSkill.value = null;
  updateApplyError.value = null;
  removingSkill.value = null;
  removeError.value = null;
  query.value = "";
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
    expect(loadGlobalSkillsMock).toHaveBeenCalledWith({ checkUpdates: true });
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
    expect(loadGlobalSkillsMock).toHaveBeenCalled();
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
    expect(loadGlobalSkillsMock).not.toHaveBeenCalled();
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

describe("InstalledFilters", () => {
  it("starts empty", () => {
    expect(query.value).toBe("");
    expect(agentFilter.value).toBeNull();
    expect(updatesOnly.value).toBe(false);
  });

  it("setQuery updates the query", () => {
    setQuery("hello");
    expect(query.value).toBe("hello");
  });

  it("setAgentFilter updates the agent filter", () => {
    setAgentFilter("Claude Code");
    expect(agentFilter.value).toBe("Claude Code");
    setAgentFilter(null);
    expect(agentFilter.value).toBeNull();
  });

  it("toggleUpdatesOnly flips updatesOnly and clears agentFilter", () => {
    setAgentFilter("Claude Code");
    toggleUpdatesOnly();
    expect(updatesOnly.value).toBe(true);
    expect(agentFilter.value).toBeNull();
  });

  it("clearFilters resets agentFilter and updatesOnly but keeps query", () => {
    setQuery("foo");
    setAgentFilter("Codex");
    toggleUpdatesOnly();
    clearFilters();
    expect(query.value).toBe("foo");
    expect(agentFilter.value).toBeNull();
    expect(updatesOnly.value).toBe(false);
  });
});
