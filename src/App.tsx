import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { Header } from "./components/Header";
import { Placeholder } from "./components/Placeholder";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { useBoot } from "./lib/boot";
import { pageTransition } from "./lib/motion";
import { Home } from "./pages/Home";
import { Installed } from "./pages/Installed";
import { Settings } from "./pages/Settings";
import { Setup } from "./pages/Setup";
import { useAppStore } from "./store/app";

function MainContent() {
  const stage = useAppStore((s) => s.stage);
  const view = useAppStore((s) => s.view);
  const completeSetup = useAppStore((s) => s.completeSetup);

  let content: ReactNode;
  let key: string;

  if (stage === "loading") {
    key = "loading";
    content = (
      <main className="flex min-w-0 flex-1 items-center justify-center">
        <span className="font-mono uppercase tracking-label text-mono text-fg-3 animate-pulse">
          · · ·
        </span>
      </main>
    );
  } else if (stage === "setup") {
    key = "setup";
    content = <Setup onComplete={completeSetup} />;
  } else if (view === "home") {
    key = "home";
    content = <Home />;
  } else if (view === "installed") {
    key = "installed";
    content = <Installed />;
  } else if (view === "settings") {
    key = "settings";
    content = <Settings />;
  } else {
    key = view;
    content = <Placeholder view={view} />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
        transition={pageTransition.transition}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
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

  return (
    <MotionConfig reducedMotion="user">
      <AppShell />
    </MotionConfig>
  );
}

export default App;
