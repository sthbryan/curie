// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import type { NodeInfo } from "@/components/types";
import { useUiStore } from "./ui";

const sampleNode: NodeInfo = {
  installed: true,
  version: "20.0.0",
  path: "/usr/bin/node",
  manager: "volta",
};

const initial = {
  theme: "dark" as const,
  lang: "en" as const,
  reducedMotion: "system" as const,
  hasBooted: false,
  stage: "loading" as const,
  node: null,
};

beforeEach(() => {
  localStorage.clear();
  useUiStore.setState(initial);
});

describe("useUiStore", () => {
  it("starts with the documented defaults", () => {
    const s = useUiStore.getState();
    expect(s.theme).toBe("dark");
    expect(s.lang).toBe("en");
    expect(s.reducedMotion).toBe("system");
    expect(s.hasBooted).toBe(false);
    expect(s.stage).toBe("loading");
    expect(s.node).toBeNull();
  });

  it("setTheme updates the theme", () => {
    useUiStore.getState().setTheme("light");
    expect(useUiStore.getState().theme).toBe("light");
  });

  it("setLang updates the language", () => {
    useUiStore.getState().setLang("es");
    expect(useUiStore.getState().lang).toBe("es");
  });

  it("setReducedMotion updates the preference", () => {
    useUiStore.getState().setReducedMotion("true");
    expect(useUiStore.getState().reducedMotion).toBe("true");
  });

  it("setStage transitions between loading, setup and home", () => {
    useUiStore.getState().setStage("setup");
    expect(useUiStore.getState().stage).toBe("setup");
    useUiStore.getState().setStage("home");
    expect(useUiStore.getState().stage).toBe("home");
  });

  it("setNode stores the detected node info", () => {
    useUiStore.getState().setNode(sampleNode);
    expect(useUiStore.getState().node).toEqual(sampleNode);
    useUiStore.getState().setNode(null);
    expect(useUiStore.getState().node).toBeNull();
  });

  it("markBooted flips hasBooted to true", () => {
    useUiStore.getState().markBooted();
    expect(useUiStore.getState().hasBooted).toBe(true);
  });

  it("completeSetup stores the node and transitions to home", () => {
    useUiStore.getState().setStage("setup");
    useUiStore.getState().completeSetup(sampleNode);
    const s = useUiStore.getState();
    expect(s.node).toEqual(sampleNode);
    expect(s.stage).toBe("home");
  });

  it("persists only theme, lang, reducedMotion, and hasBooted to localStorage", () => {
    useUiStore.getState().setTheme("light");
    useUiStore.getState().setLang("es");
    useUiStore.getState().setReducedMotion("true");
    useUiStore.getState().markBooted();
    useUiStore.getState().setStage("setup");
    useUiStore.getState().setNode(sampleNode);

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
        state: { theme: "light", lang: "es", reducedMotion: "true", hasBooted: true },
        version: 0,
      }),
    );
    await useUiStore.persist.rehydrate();
    const s = useUiStore.getState();
    expect(s.theme).toBe("light");
    expect(s.lang).toBe("es");
    expect(s.reducedMotion).toBe("true");
    expect(s.hasBooted).toBe(true);
    // stage and node fall back to defaults — not rehydrated
    expect(s.stage).toBe("loading");
    expect(s.node).toBeNull();
  });
});
