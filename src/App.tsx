import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ErrorFallback } from "./components/ErrorFallback";
import { FullPageLoading } from "./components/FullPageLoading";
import { Header } from "./components/Header";
import { Placeholder } from "./components/Placeholder";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { useBoot } from "./lib/boot";
import { pageTransition, toMotionReducedMotion } from "./lib/motion";
import { Find } from "./pages/find";
import { Home } from "./pages/home";
import { Installed } from "./pages/installed";
import { Settings } from "./pages/settings";
import { Setup } from "./pages/setup";
import { useAppStore } from "./store/app";

function RoutedPages() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
        transition={pageTransition.transition}
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/installed" component={Installed} />
          <Route path="/find" component={Find} />
          <Route path="/settings" component={Settings} />
          <Route path="/marketplace">
            <Placeholder view="marketplace" />
          </Route>
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function MainContent() {
  const stage = useAppStore((s) => s.stage);
  const lang = useAppStore((s) => s.lang);
  const completeSetup = useAppStore((s) => s.completeSetup);

  let content: ReactNode;
  let key: string;

  if (stage === "loading") {
    key = "loading";
    content = <FullPageLoading lang={lang} label="· · ·" />;
  } else if (stage === "setup") {
    key = "setup";
    content = <Setup onComplete={completeSetup} />;
  } else {
    return (
      <ErrorBoundary
        resetKeys={[stage]}
        fallback={({ error, reset }) => (
          <ErrorFallback error={error} reset={reset} variant="page" onHome={() => history.back()} />
        )}
      >
        <RoutedPages />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      resetKeys={[stage]}
      fallback={({ error, reset }) => <ErrorFallback error={error} reset={reset} variant="page" />}
    >
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
    </ErrorBoundary>
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
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <MotionConfig reducedMotion={toMotionReducedMotion(reducedMotion)}>
      <AppShell />
    </MotionConfig>
  );
}

export default App;
