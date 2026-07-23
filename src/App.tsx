import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorFallback } from "@/components/ErrorFallback";
import { FullPageLoading } from "@/components/FullPageLoading";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { StatusBar } from "@/components/StatusBar";
import { useBoot } from "@/lib/boot";
import { pageTransition } from "@/lib/motion";
import { Custom } from "@/pages/custom";
import { Explore } from "@/pages/explore";
import { Find } from "@/pages/find";
import { Home } from "@/pages/home";
import { Installed } from "@/pages/installed";
import { Settings } from "@/pages/settings";
import { Setup } from "@/pages/setup";
import { completeSetup, lang, reducedMotion, stage, theme } from "@/store/system";

function RoutedPages() {
  const [location] = useLocation();
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <AnimatePresence>
        <motion.div
          key={location}
          className="absolute inset-0 flex min-h-0 min-w-0 flex-col"
          initial={pageTransition.initial}
          animate={pageTransition.animate}
          exit={pageTransition.exit}
          transition={pageTransition.transition}
        >
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/installed" component={Installed} />
            <Route path="/marketplace" component={Explore} />
            <Route path="/find" component={Find} />
            <Route path="/custom" component={Custom} />
            <Route path="/settings" component={Settings} />
          </Switch>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MainContent() {
  let content: ReactNode;
  let key: string;

  if (stage.value === "loading") {
    key = "loading";
    content = <FullPageLoading lang={lang.value} label="· · ·" />;
  } else if (stage.value === "setup") {
    key = "setup";
    content = <Setup onComplete={completeSetup} />;
  } else {
    return (
      <ErrorBoundary
        resetKeys={[stage.value]}
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
      resetKeys={[stage.value]}
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
  const ready = stage.value === "home";

  return (
    <div className="flex h-screen w-screen flex-col bg-bg text-fg">
      {stage.value !== "loading" && <Header ready={ready} />}
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
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme.value);
  }, [theme.value]);

  useEffect(() => {
    document.documentElement.lang = lang.value;
  }, [lang.value]);

  return (
    <MotionConfig reducedMotion={reducedMotion.value}>
      <AppShell />
    </MotionConfig>
  );
}

export default App;
