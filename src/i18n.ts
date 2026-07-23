import en from "./i18n/en.json";
import es from "./i18n/es.json";

export type Lang = "en" | "es";

export type Messages = {
  app: {
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
    statusEmpty: string;
    skillsNone: string;
    statSkills: string;
    statTools: string;
    statUpdates: string;
    aiTools: string;
    active: string;
    skillWord: string;
    skillsWord: string;
    updates: string;
    updatesAvailable: string;
    updatesCheck: string;
    updatesChecking: string;
    updatesError: string;
    noUpdates: string;
    recent: string;
    events: string;
    noRecent: string;
    kindInstall: string;
    kindUpdate: string;
    actions: string;
    install: string;
    exploreBtn: string;
    viewSkills: string;
    loading: string;
    loadError: string;
    retry: string;
    notBuilt: string;
    back: string;
  };
  installed: {
    eyebrow: string;
    title: string;
    subtitle: string;
    updatesHint: string;
    refresh: string;
    refreshing: string;
    install: string;
    updateAll: string;
    updatingAll: string;
    updateOne: string;
    updatingOne: string;
    updateError: string;
    search: string;
    searchPlaceholder: string;
    showing: string;
    filterAll: string;
    filterUpdates: string;
    badgeUpdate: string;
    colName: string;
    colSource: string;
    colAgents: string;
    colWhen: string;
    colActions: string;
    local: string;
    noAgents: string;
    empty: string;
    emptyHint: string;
    noMatches: string;
  };
  find: {
    eyebrow: string;
    title: string;
    subtitle: string;
    query: string;
    queryPlaceholder: string;
    owner: string;
    ownerPlaceholder: string;
    search: string;
    searching: string;
    results: string;
    colName: string;
    colSource: string;
    colInstalls: string;
    colActions: string;
    install: string;
    installing: string;
    installed: string;
    open: string;
    hint: string;
    empty: string;
    emptyHint: string;
    error: string;
    installError: string;
    packageHint: string;
  };
  status: {
    node: string;
    agents: string;
    setupRequired: string;
  };
  settings: {
    eyebrow: string;
    title: string;
    preferences: string;
    language: string;
    languageEN: string;
    languageES: string;
    languageENFull: string;
    languageESFull: string;
    languageDesc: string;
    theme: string;
    themeDark: string;
    themeDarkHint: string;
    themeLight: string;
    themeLightHint: string;
    themeRose: string;
    themeRoseHint: string;
    themeDawn: string;
    themeDawnHint: string;
    themeDesc: string;
    reducedMotion: string;
    reducedMotionSystem: string;
    reducedMotionTrue: string;
    reducedMotionFalse: string;
    reducedMotionDesc: string;
    system: string;
    nodeVersion: string;
    nodeManager: string;
    nodePath: string;
    nodeMissing: string;
    goToSetup: string;
    about: string;
    aboutDescription: string;
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
