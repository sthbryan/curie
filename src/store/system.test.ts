// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import type { NodeInfo } from "@/components/types";
import { useSystemStore } from "./system";

const sampleNode: NodeInfo = {
  installed: true,
  version: "20.0.0",
  path: "/usr/bin/node",
  manager: "volta",
};

const initial = {
  theme: "dark" as const,
  lang: "en" as const,
  reducedMotion: "user" as const,
  hasBooted: false,
  stage: "loading" as const,
  node: null,
};

beforeEach(() => {
  localStorage.clear();
  useSystemStore.setState(initial);
});

describe("useSystemStore", () => {
  it("starts with the documented defaults", () => {
    const s = useSystemStore.getState();
    expect(s.theme).toBe("dark");
    expect(s.lang).toBe("en");
    expect(s.reducedMotion).toBe("user");
    expect(s.hasBooted).toBe(false);
    expect(s.stage).toBe("loading");
    expect(s.node).toBeNull();
  });

  it("setTheme updates the theme", () => {
    useSystemStore.getState().setTheme("light");
    expect(useSystemStore.getState().theme).toBe("light");
  });

  it("setLang updates the language", () => {
    useSystemStore.getState().setLang("es");
    expect(useSystemStore.getState().lang).toBe("es");
  });

  it("setReducedMotion updates the preference", () => {
    useSystemStore.getState().setReducedMotion("always");
    expect(useSystemStore.getState().reducedMotion).toBe("always");
  });

  it("setStage transitions between loading, setup and home", () => {
    useSystemStore.getState().setStage("setup");
    expect(useSystemStore.getState().stage).toBe("setup");
    useSystemStore.getState().setStage("home");
    expect(useSystemStore.getState().stage).toBe("home");
  });

  it("setNode stores the detected node info", () => {
    useSystemStore.getState().setNode(sampleNode);
    expect(useSystemStore.getState().node).toEqual(sampleNode);
    useSystemStore.getState().setNode(null);
    expect(useSystemStore.getState().node).toBeNull();
  });

  it("markBooted flips hasBooted to true", () => {
    useSystemStore.getState().markBooted();
    expect(useSystemStore.getState().hasBooted).toBe(true);
  });

  it("completeSetup stores the node and transitions to home", () => {
    useSystemStore.getState().setStage("setup");
    useSystemStore.getState().completeSetup(sampleNode);
    const s = useSystemStore.getState();
    expect(s.node).toEqual(sampleNode);
    expect(s.stage).toBe("home");
  });

  it("persists only theme, lang, reducedMotion, and hasBooted to localStorage", () => {
    useSystemStore.getState().setTheme("light");
    useSystemStore.getState().setLang("es");
    useSystemStore.getState().setReducedMotion("always");
    useSystemStore.getState().markBooted();
    useSystemStore.getState().setStage("setup");
    useSystemStore.getState().setNode(sampleNode);

    const raw = localStorage.getItem("curie.ui");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? "{}") as { state?: Record<string, unknown> };
    const persistedKeys = Object.keys(parsed.state ?? {}).sort();
    expect(persistedKeys).toEqual(["hasBooted", "lang", "reducedMotion", "theme"]);

    // stage and node must NOT be persisted
    expect(parsed.state?.stage).toBeUndefined();
    expect(parsed.state?.node).toBeUndefined();
  });

  it("rehydrates the partial state from localStorage on init", async () => {
    localStorage.setItem(
      "curie.ui",
      JSON.stringify({
        state: { theme: "light", lang: "es", reducedMotion: "always", hasBooted: true },
        version: 0,
      }),
    );
    await useSystemStore.persist.rehydrate();
    const s = useSystemStore.getState();
    expect(s.theme).toBe("light");
    expect(s.lang).toBe("es");
    expect(s.reducedMotion).toBe("always");
    expect(s.hasBooted).toBe(true);
    // stage and node fall back to defaults — not rehydrated
    expect(s.stage).toBe("loading");
    expect(s.node).toBeNull();
  });
});
