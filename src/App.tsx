import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Home } from "./components/Home";
import { Placeholder } from "./components/Placeholder";
import { Setup } from "./components/Setup";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import type { NodeInfo, Stage, ThemeMode, View } from "./components/types";
import { detectLang, type Lang } from "./i18n";

const LANG_KEY = "curie.lang";

function getSavedLang(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === "en" || v === "es" ? v : null;
  } catch {
    return null;
  }
}

function saveLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [view, setView] = useState<View>("home");
  const [lang, setLangState] = useState<Lang>(() => getSavedLang() ?? "en");
  const [stage, setStage] = useState<Stage>("loading");
  const [node, setNode] = useState<NodeInfo | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    saveLang(lang);
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const locale = await invoke<string>("get_locale");
        if (cancelled) return;
        if (!getSavedLang()) {
          setLangState(detectLang(locale));
        }
      } catch {
        // ignore
      }
      try {
        const info = await invoke<NodeInfo>("detect_node");
        if (cancelled) return;
        setNode(info);
        setStage(info.installed ? "home" : "setup");
      } catch {
        if (!cancelled) setStage("setup");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
  }

  function handleSetupComplete(info: NodeInfo) {
    setNode(info);
    setView("home");
    setStage("home");
  }

  const main =
    stage === "loading" ? (
      <main className="flex min-w-0 flex-1 items-center justify-center">
        <span className="font-mono uppercase tracking-label text-mono text-fg-3 animate-pulse">
          · · ·
        </span>
      </main>
    ) : stage === "setup" || stage === "installing" || stage === "done" || stage === "error" ? (
      <Setup lang={lang} onComplete={handleSetupComplete} />
    ) : view === "home" ? (
      <Home lang={lang} onNavigate={(v) => setView(v)} />
    ) : (
      <Placeholder lang={lang} view={view} onBack={() => setView("home")} />
    );

  const showSidebar = stage === "home";
  const showHeader = stage !== "loading";

  return (
    <div className="flex h-screen w-screen flex-col bg-bg text-fg">
      {showHeader && <Header lang={lang} ready={stage === "home"} />}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {showSidebar && <Sidebar lang={lang} view={view} setView={setView} />}
        {main}
      </div>
      {showHeader && stage === "home" && (
        <StatusBar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} node={node} />
      )}
    </div>
  );
}

export default App;
