// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillRemoveResult, SkillUpdateResult } from "@/components/types";
import { useInstalledActionsStore, useInstalledFiltersStore } from "./store";

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
  useInstalledActionsStore.setState({
    updatingSkill: null,
    updateApplyError: null,
    removingSkill: null,
    removeError: null,
  });
  useInstalledFiltersStore.setState({
    query: "",
    agentFilter: null,
    updatesOnly: false,
  });
});

describe("useInstalledActionsStore", () => {
  it("starts with no in-flight action and no errors", () => {
    const s = useInstalledActionsStore.getState();
    expect(s.updatingSkill).toBeNull();
    expect(s.updateApplyError).toBeNull();
    expect(s.removingSkill).toBeNull();
    expect(s.removeError).toBeNull();
  });

  it("update() with no names invokes update_skills with null and refreshes", async () => {
    const result: SkillUpdateResult = { updated: ["a"], message: "ok" };
    invokeMock.mockResolvedValue(result);

    await useInstalledActionsStore.getState().update();

    expect(invokeMock).toHaveBeenCalledWith("update_skills", { skills: null });
    expect(loadGlobalSkillsMock).toHaveBeenCalledWith({ checkUpdates: true });
    const s = useInstalledActionsStore.getState();
    expect(s.updatingSkill).toBeNull();
    expect(s.updateApplyError).toBeNull();
  });

  it("update() with a single name tags updatingSkill with the name and rethrows on failure", async () => {
    invokeMock.mockRejectedValueOnce(new Error("network down"));

    await expect(useInstalledActionsStore.getState().update(["only-one"])).rejects.toThrow(
      "network down",
    );

    expect(invokeMock).toHaveBeenCalledWith("update_skills", { skills: ["only-one"] });
    const s = useInstalledActionsStore.getState();
    expect(s.updatingSkill).toBeNull();
    expect(s.updateApplyError).toBe("network down");
  });

  it("update() with multiple names shows '*' as the in-flight tag", async () => {
    invokeMock.mockResolvedValue({ updated: [], message: "ok" });
    const promise = useInstalledActionsStore.getState().update(["a", "b"]);
    expect(useInstalledActionsStore.getState().updatingSkill).toBe("*");
    await promise;
    expect(useInstalledActionsStore.getState().updatingSkill).toBeNull();
  });

  it("update() captures a plain string rejection message", async () => {
    invokeMock.mockRejectedValueOnce("plain failure");
    await useInstalledActionsStore
      .getState()
      .update()
      .catch(() => {});
    expect(useInstalledActionsStore.getState().updateApplyError).toBe("plain failure");
  });

  it("remove() with one name shows the name and refreshes on success", async () => {
    const result: SkillRemoveResult = { removed: ["only"], message: "ok" };
    invokeMock.mockResolvedValue(result);

    await useInstalledActionsStore.getState().remove(["only"]);

    expect(invokeMock).toHaveBeenCalledWith("remove_skills", { skills: ["only"] });
    expect(loadGlobalSkillsMock).toHaveBeenCalled();
    expect(useInstalledActionsStore.getState().removingSkill).toBeNull();
  });

  it("remove() with multiple names shows '*'", async () => {
    invokeMock.mockResolvedValue({ removed: ["a", "b"], message: "ok" });
    const promise = useInstalledActionsStore.getState().remove(["a", "b"]);
    expect(useInstalledActionsStore.getState().removingSkill).toBe("*");
    await promise;
  });

  it("remove() with empty names is a no-op", async () => {
    await useInstalledActionsStore.getState().remove([]);
    expect(invokeMock).not.toHaveBeenCalled();
    expect(loadGlobalSkillsMock).not.toHaveBeenCalled();
  });

  it("remove() surfaces a failure and rethrows", async () => {
    invokeMock.mockRejectedValueOnce(new Error("rm failed"));
    await expect(useInstalledActionsStore.getState().remove(["x"])).rejects.toThrow("rm failed");
    const s = useInstalledActionsStore.getState();
    expect(s.removeError).toBe("rm failed");
    expect(s.removingSkill).toBeNull();
  });

  it("dismissErrors clears both error fields", async () => {
    invokeMock.mockRejectedValueOnce("upd-err").mockRejectedValueOnce("rm-err");
    await useInstalledActionsStore
      .getState()
      .update()
      .catch(() => {});
    await useInstalledActionsStore
      .getState()
      .remove(["x"])
      .catch(() => {});
    expect(useInstalledActionsStore.getState().updateApplyError).toBe("upd-err");
    expect(useInstalledActionsStore.getState().removeError).toBe("rm-err");

    useInstalledActionsStore.getState().dismissErrors();
    expect(useInstalledActionsStore.getState().updateApplyError).toBeNull();
    expect(useInstalledActionsStore.getState().removeError).toBeNull();
  });
});

describe("useInstalledFiltersStore", () => {
  it("starts empty", () => {
    const s = useInstalledFiltersStore.getState();
    expect(s.query).toBe("");
    expect(s.agentFilter).toBeNull();
    expect(s.updatesOnly).toBe(false);
  });

  it("setQuery updates the query", () => {
    useInstalledFiltersStore.getState().setQuery("hello");
    expect(useInstalledFiltersStore.getState().query).toBe("hello");
  });

  it("setAgentFilter updates the agent filter", () => {
    useInstalledFiltersStore.getState().setAgentFilter("Claude Code");
    expect(useInstalledFiltersStore.getState().agentFilter).toBe("Claude Code");
    useInstalledFiltersStore.getState().setAgentFilter(null);
    expect(useInstalledFiltersStore.getState().agentFilter).toBeNull();
  });

  it("toggleUpdatesOnly flips updatesOnly and clears agentFilter", () => {
    useInstalledFiltersStore.getState().setAgentFilter("Claude Code");
    useInstalledFiltersStore.getState().toggleUpdatesOnly();
    const s = useInstalledFiltersStore.getState();
    expect(s.updatesOnly).toBe(true);
    expect(s.agentFilter).toBeNull();
  });

  it("clearFilters resets agentFilter and updatesOnly but keeps query", () => {
    useInstalledFiltersStore.getState().setQuery("foo");
    useInstalledFiltersStore.getState().setAgentFilter("Codex");
    useInstalledFiltersStore.getState().toggleUpdatesOnly();
    useInstalledFiltersStore.getState().clearFilters();
    const s = useInstalledFiltersStore.getState();
    expect(s.query).toBe("foo");
    expect(s.agentFilter).toBeNull();
    expect(s.updatesOnly).toBe(false);
  });
});
