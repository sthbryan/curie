import { AnimatePresence, motion } from "motion/react";
import { Route, Switch, useLocation } from "wouter";
import { pageTransition } from "@/lib/motion";
import { Custom } from "@/pages/custom";
import { Explore } from "@/pages/explore";
import { Find } from "@/pages/find";
import { Home } from "@/pages/home";
import { Installed } from "@/pages/installed";
import { Settings } from "@/pages/settings";

export function RoutedPages() {
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
