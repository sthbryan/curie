import { describe, expect, it } from "vitest";
import { detectLang, t } from "./i18n";
import en from "./i18n/en.json";
import es from "./i18n/es.json";

function collectKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix.replace(/\.$/, "")];
  return Object.entries(obj).flatMap(([k, v]) => collectKeys(v, `${prefix + k}.`));
}

describe("detectLang", () => {
  it("returns es for Spanish locales", () => {
    expect(detectLang("es-ES")).toBe("es");
    expect(detectLang("es-MX")).toBe("es");
    expect(detectLang("es-AR")).toBe("es");
    expect(detectLang("ES")).toBe("es");
    expect(detectLang("es")).toBe("es");
  });

  it("returns en for everything else", () => {
    expect(detectLang("en-US")).toBe("en");
    expect(detectLang("en-GB")).toBe("en");
    expect(detectLang("fr-FR")).toBe("en");
    expect(detectLang("de-DE")).toBe("en");
    expect(detectLang("pt-BR")).toBe("en");
    expect(detectLang("")).toBe("en");
  });
});

describe("t", () => {
  it("resolves nested keys", () => {
    expect(t("en", "home.status")).toBe("STATUS · NPX SKILLS");
    expect(t("es", "home.status")).toBe("ESTADO · NPX SKILLS");
    expect(t("en", "app.ready")).toBe("READY");
    expect(t("es", "app.ready")).toBe("LISTO");
  });

  it("resolves keys across all namespaces", () => {
    expect(t("en", "nav.home")).toBe("HOME");
    expect(t("es", "nav.home")).toBe("INICIO");
    expect(t("en", "setup.cta")).toBe("DO IT FOR ME");
    expect(t("es", "setup.cta")).toBe("HAZLO POR MÍ");
    expect(t("en", "stages.download")).toBe("Downloading Volta installer");
    expect(t("es", "stages.download")).toBe("Descargando instalador de Volta");
    expect(t("en", "status.node")).toBe("NODE");
    expect(t("es", "status.agents")).toBe("AGENTES");
    expect(t("en", "settings.themeRose")).toBe("ROSE");
    expect(t("es", "settings.themeDawn")).toBe("DAWN");
  });

  it("interpolates a single variable", () => {
    expect(t("en", "home.skillsReady", { n: 3 })).toBe("skills ready across 3 AI tools");
    expect(t("es", "home.skillsReady", { n: 3 })).toBe("skills listas en 3 herramientas de IA");
  });

  it("interpolates multiple variables in one string", () => {
    expect(t("en", "home.active", { n: 5 })).toBe("5 ACTIVE");
    expect(t("es", "home.active", { n: 1 })).toBe("1 ACTIVAS");
  });

  it("interpolates repeated variables", () => {
    expect(t("en", "home.events", { n: 12 })).toBe("12 EVENTS");
  });

  it("returns key unchanged when path is missing", () => {
    expect(t("en", "no.exists")).toBe("no.exists");
    expect(t("es", "home.notAKey")).toBe("home.notAKey");
  });

  it("ignores unknown variables in vars map", () => {
    expect(t("en", "home.events", { n: 4, extra: "ignored" })).toBe("4 EVENTS");
  });

  it("handles numeric vars correctly", () => {
    expect(t("en", "home.events", { n: 0 })).toBe("0 EVENTS");
  });
});

describe("JSON parity", () => {
  it("en.json and es.json have the exact same key tree", () => {
    const enKeys = collectKeys(en).sort();
    const esKeys = collectKeys(es).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it("no empty strings in en.json", () => {
    function findEmpty(obj: unknown, path = ""): string[] {
      if (typeof obj === "string") return obj === "" ? [path] : [];
      if (obj && typeof obj === "object") {
        return Object.entries(obj).flatMap(([k, v]) => findEmpty(v, path ? `${path}.${k}` : k));
      }
      return [];
    }
    expect(findEmpty(en)).toEqual([]);
    expect(findEmpty(es)).toEqual([]);
  });
});
