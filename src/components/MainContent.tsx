import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorFallback } from "@/components/ErrorFallback";
import { FullPageLoading } from "@/components/FullPageLoading";
import { pageTransition } from "@/lib/motion";
import { Setup } from "@/pages/setup";
import { completeSetup, stage } from "@/store/system";
import { RoutedPages } from "./RoutedPages";

export function MainContent() {
  let content: ReactNode;
  let key: string;

  if (stage.value === "loading") {
    key = "loading";
    content = <FullPageLoading label="· · ·" />;
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
