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
    updatesLabel: string;
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
  en: {
    app: {
      version: "v0.1.0",
      ready: "READY",
    },
    nav: {
      home: "HOME",
      skills: "SKILLS",
      explore: "EXPLORE",
      find: "FIND",
      settings: "SET",
    },
    setup: {
      eyebrow: "FIRST RUN",
      title: "Let's set up your environment",
      subtitle:
        "No need to configure anything. We just need one tool to start managing your skills.",
      checklist: "WHAT WE NEED",
      toolName: "Node.js",
      toolDesc: "Runs the skills CLI. We'll handle the install for you.",
      prompt: "Want us to set it up for you?",
      cta: "DO IT FOR ME",
      manual: "I'll do it myself",
      manualHint: "Paste this into your terminal:",
      manualCommand: "curl -fsSL https://get.volta.sh | bash\nvolta install node",
      manualLink: "Open volta.sh ↗",
      progressEyebrow: "INSTALLING",
      doneEyebrow: "ALL SET",
      doneTitle: "Your environment is ready",
      doneHint: "Node.js is installed via Volta. We can now manage your skills.",
      continue: "CONTINUE →",
      errorEyebrow: "SOMETHING FAILED",
      errorHint: "The installer ran into an issue. You can try again.",
      retry: "TRY AGAIN",
    },
    stages: {
      checking: "Checking your environment",
      download: "Downloading Volta installer",
      node: "Installing Node.js via Volta",
      done: "Node.js is ready",
      error: "Something went wrong",
    },
    home: {
      status: "STATUS · WORKING",
      skillsReady: "skills ready across {n} AI tools",
      needAttention: "{n} NEED ATTENTION",
      updates: "{n} skills have updates available",
      updateCta: "UPDATE ALL →",
      aiTools: "AI TOOLS",
      active: "{n} ACTIVE",
      current: "CURRENT",
      updatesLabel: "UPDATES",
      updateWord: "UPDATE",
      recent: "RECENT",
      events: "{n} EVENTS",
      actions: "QUICK ACTIONS",
      install: "+ INSTALL A SKILL",
      exploreBtn: "EXPLORE",
      share: "SHARE WITH TEAM",
      notBuilt: "SCREEN NOT YET BUILT",
      back: "BACK TO HOME",
    },
    status: {
      node: "NODE",
      agents: "AGENTS",
    },
  },
  es: {
    app: {
      version: "v0.1.0",
      ready: "LISTO",
    },
    nav: {
      home: "INICIO",
      skills: "SKILLS",
      explore: "EXPLORAR",
      find: "BUSCAR",
      settings: "AJUSTES",
    },
    setup: {
      eyebrow: "PRIMERA VEZ",
      title: "Preparemos tu entorno",
      subtitle:
        "No tienes que configurar nada. Solo necesitamos una herramienta para empezar a gestionar tus skills.",
      checklist: "QUÉ NECESITAMOS",
      toolName: "Node.js",
      toolDesc: "Ejecuta el CLI de skills. Nosotros nos encargamos de la instalación.",
      prompt: "¿Quieres que lo hagamos por ti?",
      cta: "HAZLO POR MÍ",
      manual: "Lo haré yo mismo",
      manualHint: "Pega esto en tu terminal:",
      manualCommand: "curl -fsSL https://get.volta.sh | bash\nvolta install node",
      manualLink: "Abrir volta.sh ↗",
      progressEyebrow: "INSTALANDO",
      doneEyebrow: "LISTO",
      doneTitle: "Tu entorno está preparado",
      doneHint: "Node.js quedó instalado con Volta. Ya podemos gestionar tus skills.",
      continue: "CONTINUAR →",
      errorEyebrow: "ALGO FALLÓ",
      errorHint: "El instalador tuvo un problema. Puedes intentar de nuevo.",
      retry: "REINTENTAR",
    },
    stages: {
      checking: "Revisando tu entorno",
      download: "Descargando instalador de Volta",
      node: "Instalando Node.js con Volta",
      done: "Node.js está listo",
      error: "Algo salió mal",
    },
    home: {
      status: "ESTADO · FUNCIONANDO",
      skillsReady: "skills listas en {n} herramientas de IA",
      needAttention: "{n} NECESITAN ATENCIÓN",
      updates: "{n} skills tienen actualizaciones",
      updateCta: "ACTUALIZAR TODO →",
      aiTools: "HERRAMIENTAS DE IA",
      active: "{n} ACTIVAS",
      current: "AL DÍA",
      updatesLabel: "ACTUALIZACIONES",
      updateWord: "ACTUALIZAR",
      recent: "RECIENTE",
      events: "{n} EVENTOS",
      actions: "ACCIONES RÁPIDAS",
      install: "+ INSTALAR SKILL",
      exploreBtn: "EXPLORAR",
      share: "COMPARTIR CON EQUIPO",
      notBuilt: "PANTALLA NO CONSTRUIDA",
      back: "VOLVER AL INICIO",
    },
    status: {
      node: "NODE",
      agents: "AGENTES",
    },
  },
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

export function plural(n: number, lang: Lang, one: string, other: string): string {
  if (lang === "es") return n === 1 ? one : other;
  return n === 1 ? one : other;
}
