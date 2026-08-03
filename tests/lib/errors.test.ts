import { beforeEach, describe, expect, it } from "vitest";
import { errorMessage } from "@/lib/errors";
import { setLang } from "@/store/system";

const SEP = "\u001f";

describe("errorMessage", () => {
  beforeEach(() => {
    setLang("en");
  });

  it("passes through plain strings that are not codes", () => {
    expect(errorMessage("something odd happened")).toBe("something odd happened");
  });

  it("unwraps Error instances", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
  });

  it("stringifies anything else", () => {
    expect(errorMessage(42)).toBe("42");
    expect(errorMessage(null)).toBe("null");
  });

  it("translates a bare code", () => {
    expect(errorMessage("errors.homeMissing")).toBe("Could not find your home folder.");
  });

  it("interpolates the detail after the separator", () => {
    expect(errorMessage(`errors.notAFile${SEP}/tmp/skill.md`)).toBe("/tmp/skill.md is not a file.");
  });

  it("follows the active language", () => {
    setLang("es");
    expect(errorMessage("errors.homeMissing")).toBe("No se pudo encontrar tu carpeta personal.");
    expect(errorMessage(`errors.notAFile${SEP}/tmp/a.md`)).toBe("/tmp/a.md no es un archivo.");
  });

  it("keeps the detail visible when a code has no translation", () => {
    expect(errorMessage(`errors.notARealCode${SEP}/tmp/a.md`)).toBe(
      "errors.notARealCode (/tmp/a.md)",
    );
  });

  it("returns the code when it is unknown and carries no detail", () => {
    expect(errorMessage("errors.notARealCode")).toBe("errors.notARealCode");
  });
});
