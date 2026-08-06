import { lazy, Suspense } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import { ScopeGuard, useScopeSync } from "@/components/ScopeGuard";
import { pageAnim } from "@/lib/motion";
import { Home } from "@/pages/home";

const Custom = lazy(() => import("@/pages/custom").then((m) => ({ default: m.Custom })));
const Explore = lazy(() => import("@/pages/explore").then((m) => ({ default: m.Explore })));
const Find = lazy(() => import("@/pages/find").then((m) => ({ default: m.Find })));
const Installed = lazy(() => import("@/pages/installed").then((m) => ({ default: m.Installed })));
const Projects = lazy(() => import("@/pages/projects").then((m) => ({ default: m.Projects })));
const Settings = lazy(() => import("@/pages/settings").then((m) => ({ default: m.Settings })));

export function RoutedPages() {
  const [location] = useLocation();
  useScopeSync();

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div key={location} {...pageAnim} className="absolute inset-0 flex min-h-0 min-w-0 flex-col">
        <Suspense fallback={<div className="flex min-h-0 min-w-0 flex-1 flex-col" />}>
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
        </Suspense>
      </div>
    </div>
  );
}
