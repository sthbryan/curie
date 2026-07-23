import { useEffect } from "react";
import { Header } from "./components/Header";
import { Placeholder } from "./components/Placeholder";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { useBoot } from "./lib/boot";
import { Home } from "./pages/Home";
import { Settings } from "./pages/Settings";
import { Setup } from "./pages/Setup";
import { useAppStore } from "./store/app";

function MainContent() {
  const stage = useAppStore((s) => s.stage);
  const view = useAppStore((s) => s.view);
  const completeSetup = useAppStore((s) => s.completeSetup);

  if (stage === "loading") {
    return (
      <main className="flex min-w-0 flex-1 items-center justify-center">
        <span className="font-mono uppercase tracking-label text-mono text-fg-3 animate-pulse">
          · · ·
        </span>
      </main>
    );
  }

  if (stage === "setup") {
    return <Setup onComplete={completeSetup} />;
  }

  if (view === "home") return <Home />;
  if (view === "settings") return <Settings />;
  return <Placeholder view={view} />;
}

function AppShell() {
  const stage = useAppStore((s) => s.stage);
  const ready = stage === "home";

  return (
    <div className="flex h-screen w-screen flex-col bg-bg text-fg">
      {stage !== "loading" && <Header ready={ready} />}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {ready && <Sidebar />}
        <MainContent />
      </div>
      {ready && <StatusBar />}
    </div>
  );
}

function App() {
  useBoot();

  const theme = useAppStore((s) => s.theme);
  const lang = useAppStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <AppShell />;
}

export default App;
