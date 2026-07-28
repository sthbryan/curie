import { AnimatePresence, motion } from "motion/react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { ScopeGuard, useScopeSync } from "@/components/ScopeGuard";
import { pageTransition } from "@/lib/motion";
import { Custom } from "@/pages/custom";
import { Explore } from "@/pages/explore";
import { Find } from "@/pages/find";
import { Home } from "@/pages/home";
import { Installed } from "@/pages/installed";
import { Projects } from "@/pages/projects";
import { Settings } from "@/pages/settings";

export function RoutedPages() {
  const [location] = useLocation();
  useScopeSync();

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
            <Route path="/projects" component={Projects} />
            <Route path="/installed" component={Installed} />
            <Route path="/marketplace" component={Explore} />
            <Route path="/find" component={Find} />
            <Route path="/custom" component={Custom} />
            <Route path="/settings" component={Settings} />

            <Route path="/p/:id">{(params) => <Redirect to={`/p/${params.id}/installed`} />}</Route>
            <Route path="/p/:id/installed">
              <ScopeGuard>
                <Installed />
              </ScopeGuard>
            </Route>
            <Route path="/p/:id/marketplace">
              <ScopeGuard>
                <Explore />
              </ScopeGuard>
            </Route>
            <Route path="/p/:id/find">
              <ScopeGuard>
                <Find />
              </ScopeGuard>
            </Route>
            <Route path="/p/:id/custom">
              <ScopeGuard>
                <Custom />
              </ScopeGuard>
            </Route>
          </Switch>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
