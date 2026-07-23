// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import type { NodeInfo } from "@/components/types";
import {
  completeSetup,
  hasBooted,
  lang,
  markBooted,
  node,
  reducedMotion,
  setLang,
  setNode,
  setReducedMotion,
  setStage,
  setTheme,
  stage,
  theme,
} from "@/store/system";

const sampleNode: NodeInfo = {
  installed: true,
  version: "20.0.0",
  path: "/usr/bin/node",
  manager: "volta",
};

beforeEach(() => {
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
