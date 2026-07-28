import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Settings } from "@/components/types";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

const { readSettings, resolveSettings, writeSettings } = await import("@/lib/settings");

const stored: Settings = {
  version: 1,
  theme: "nord",
  lang: "es",
  reducedMotion: "always",
  hasBooted: true,
};

const cached = {
  theme: "dark",
  lang: "en",
  reducedMotion: "user",
  hasBooted: false,
} as const;

beforeEach(() => {
  invokeMock.mockReset();
});

describe("readSettings", () => {
  it("returns the settings the backend reports", async () => {
    invokeMock.mockResolvedValue(stored);
    await expect(readSettings()).resolves.toEqual(stored);
    expect(invokeMock).toHaveBeenCalledWith("read_settings");
  });

  it("returns null when the command rejects", async () => {
    invokeMock.mockRejectedValue("could not resolve home directory");
    await expect(readSettings()).resolves.toBeNull();
  });
});

describe("writeSettings", () => {
  it("sends the patch without a version", async () => {
    invokeMock.mockResolvedValue(undefined);
    await writeSettings(cached);
    expect(invokeMock).toHaveBeenCalledWith("write_settings", { settings: cached });
  });
});

describe("resolveSettings", () => {
  it("prefers the values from the file", () => {
    expect(resolveSettings(stored, cached)).toEqual({
      theme: "nord",
      lang: "es",
      reducedMotion: "always",
      hasBooted: true,
    });
  });

  it("falls back to the cache for values it does not recognise", () => {
    const corrupt = {
      version: 1,
      theme: "vaporwave",
      lang: "fr",
      reducedMotion: "sometimes",
      hasBooted: false,
    } as unknown as Settings;

    expect(resolveSettings(corrupt, cached)).toEqual(cached);
  });

  it("degrades one field at a time", () => {
    const partial = { ...stored, theme: "vaporwave" } as unknown as Settings;
    const resolved = resolveSettings(partial, cached);

    expect(resolved.theme).toBe("dark");
    expect(resolved.lang).toBe("es");
    expect(resolved.reducedMotion).toBe("always");
  });

  it("treats hasBooted as the or of both sources", () => {
    expect(resolveSettings({ ...stored, hasBooted: false }, { ...cached, hasBooted: true })).toEqual(
      expect.objectContaining({ hasBooted: true }),
    );
    expect(
      resolveSettings({ ...stored, hasBooted: true }, { ...cached, hasBooted: false }),
    ).toEqual(expect.objectContaining({ hasBooted: true }));
  });
});
