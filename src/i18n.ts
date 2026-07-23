import en from "./i18n/en.json";
import es from "./i18n/es.json";
import type { Messages } from "./types/Messages";

export type Lang = "en" | "es";

const messages: Record<Lang, Messages> = {
  en: en as Messages,
  es: es as Messages,
};

export function detectLang(locale: string): Lang {
  const l = locale.toLowerCase();
  return l.startsWith("es") ? "es" : "en";
}

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  let cur: unknown = messages[lang];
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  if (typeof cur !== "string") return key;
  if (!vars) return cur;
  return Object.entries(vars).reduce((acc, [k, v]) => {
    const re = new RegExp(`\\{${k}\\}`, "g");
    return acc.replace(re, String(v));
  }, cur);
}

export function plural(n: number, _lang: Lang, one: string, other: string): string {
  return n === 1 ? one : other;
}
