import en from "./i18n/en.json";
import es from "./i18n/es.json";

export type Lang = "en" | "es";

export type Messages = {
  app: {
    version: string;
    ready: string;
  };
  nav: {
    home: string;
    skills: string;
    explore: string;
    find: string;
    settings: string;
  };
  setup: {
    eyebrow: string;
    title: string;
    subtitle: string;
    checklist: string;
    toolName: string;
    toolDesc: string;
    prompt: string;
    cta: string;
    manual: string;
    manualHint: string;
    manualCommand: string;
    manualLink: string;
    progressEyebrow: string;
    doneEyebrow: string;
    doneTitle: string;
    doneHint: string;
    continue: string;
    errorEyebrow: string;
    errorHint: string;
    retry: string;
  };
  stages: {
    checking: string;
    download: string;
    node: string;
    done: string;
    error: string;
  };
  home: {
    status: string;
    skillsReady: string;
    needAttention: string;
    updates: string;
    updateCta: string;
    aiTools: string;
    active: string;
    current: string;
    updateWord: string;
    recent: string;
    events: string;
    actions: string;
    install: string;
    exploreBtn: string;
    share: string;
    notBuilt: string;
    back: string;
  };
  status: {
    node: string;
    agents: string;
  };
};

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
