// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";

import { loadPartial, savePartial } from "@/lib/persistence";

const KEY = "curie.test";

beforeEach(() => {
  localStorage.clear();
});

describe("persistence", () => {
  const fallback = {
    theme: "dark" as const,
    colorMode: "auto" as const,
    sidebarOpen: false,
    lang: "en" as const,
    reducedMotion: "user" as const,
    hasBooted: false,
  };

  it("returns fallback when no data exists", () => {
    const result = loadPartial(KEY, fallback);
    expect(result).toEqual(fallback);
  });

  it("saves and loads partial data", () => {
    savePartial(KEY, { ...fallback, hasBooted: true });
    const result = loadPartial(KEY, fallback);
    expect(result.hasBooted).toBe(true);
    expect(result.theme).toBe("dark");
  });

  it("merges saved data with fallback", () => {
    savePartial(KEY, { ...fallback, theme: "pulso", sidebarOpen: true });
    const result = loadPartial(KEY, { ...fallback, theme: "dark" });
    expect(result.theme).toBe("pulso");
    expect(result.sidebarOpen).toBe(true);
  });

  it("returns fallback on JSON parse error", () => {
    localStorage.setItem(KEY, "not-json");
    const result = loadPartial(KEY, fallback);
    expect(result).toEqual(fallback);
  });
});
