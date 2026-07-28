// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NodeInfo } from "@/components/types";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

const {
  applySettings,
  completeSetup,
  flushSettings,
  hasBooted,
  lang,
  markBooted,
  markHydrated,
  node,
  reducedMotion,
  resetSettingsPersistence,
  setLang,
  setNode,
  setReducedMotion,
  setStage,
  setTheme,
  stage,
  theme,
} = await import("@/store/system");

const sampleNode: NodeInfo = {
  installed: true,
  version: "20.0.0",
  path: "/usr/bin/node",
  manager: "volta",
};

beforeEach(() => {
  invokeMock.mockReset();
  invokeMock.mockResolvedValue(undefined);
  resetSettingsPersistence();
  localStorage.clear();
  theme.value = "dark";
  lang.value = "en";
  reducedMotion.value = "user";
  hasBooted.value = false;
  stage.value = "loading";
  node.value = null;
});

describe("system store (signals)", () => {
  it("starts with the documented defaults", () => {
    expect(theme.value).toBe("dark");
    expect(lang.value).toBe("en");
    expect(reducedMotion.value).toBe("user");
    expect(hasBooted.value).toBe(false);
    expect(stage.value).toBe("loading");
    expect(node.value).toBeNull();
  });

  it("setTheme updates the theme", () => {
    setTheme("light");
    expect(theme.value).toBe("light");
  });

  it("setLang updates the language", () => {
    setLang("es");
    expect(lang.value).toBe("es");
  });

  it("setReducedMotion updates the preference", () => {
    setReducedMotion("always");
    expect(reducedMotion.value).toBe("always");
  });

  it("setStage transitions between loading, setup and home", () => {
    setStage("setup");
    expect(stage.value).toBe("setup");
    setStage("home");
    expect(stage.value).toBe("home");
  });

  it("setNode stores the detected node info", () => {
    setNode(sampleNode);
    expect(node.value).toEqual(sampleNode);
    setNode(null);
    expect(node.value).toBeNull();
  });

  it("markBooted flips hasBooted to true", () => {
    markBooted();
    expect(hasBooted.value).toBe(true);
  });

  it("completeSetup stores the node and transitions to home", () => {
    setStage("setup");
    completeSetup(sampleNode);
    expect(node.value).toEqual(sampleNode);
    expect(stage.value).toBe("home");
  });

  it("persists only theme, lang, reducedMotion, and hasBooted to localStorage", () => {
    setTheme("light");
    setLang("es");
    setReducedMotion("always");
    markBooted();
    setStage("setup");
    setNode(sampleNode);

    const raw = localStorage.getItem("curie.system");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? "{}") as Record<string, unknown>;
    const persistedKeys = Object.keys(parsed).sort();
    expect(persistedKeys).toEqual(["hasBooted", "lang", "reducedMotion", "theme"]);
    expect(parsed.stage).toBeUndefined();
    expect(parsed.node).toBeUndefined();
  });
});

describe("settings file persistence", () => {
  it("caches to localStorage but never writes the file before hydration", async () => {
    setTheme("light");
    await flushSettings();

    expect(localStorage.getItem("curie.system")).toContain("light");
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("applySettings hydrates every field without writing back", async () => {
    applySettings({ theme: "nord", lang: "es", reducedMotion: "always", hasBooted: true });

    expect(theme.value).toBe("nord");
    expect(lang.value).toBe("es");
    expect(reducedMotion.value).toBe("always");
    expect(hasBooted.value).toBe(true);

    await flushSettings();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("writes the file once hydrated", async () => {
    markHydrated();
    setTheme("light");

    expect(localStorage.getItem("curie.system")).toContain("light");
    await flushSettings();

    expect(invokeMock).toHaveBeenCalledWith("write_settings", {
      settings: { theme: "light", lang: "en", reducedMotion: "user", hasBooted: false },
    });
  });

  it("coalesces a burst of changes into a single write", async () => {
    markHydrated();
    setTheme("light");
    setLang("es");
    setReducedMotion("always");
    await flushSettings();

    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith("write_settings", {
      settings: { theme: "light", lang: "es", reducedMotion: "always", hasBooted: false },
    });
  });

  it("keeps the app running when the write fails", async () => {
    invokeMock.mockRejectedValue("could not save settings");
    markHydrated();
    setTheme("light");

    await expect(flushSettings()).resolves.toBeUndefined();
    expect(theme.value).toBe("light");
  });
});
