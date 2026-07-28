import { Header } from "@/components/Header";
import { MainContent } from "@/components/MainContent";
import { ScopeAnnouncer } from "@/components/ScopeAnnouncer";
import { Sidebar } from "@/components/Sidebar";
import { StatusBar } from "@/components/StatusBar";
import { useScope } from "@/lib/routes";
import { stage } from "@/store/system";

export function AppShell() {
  const ready = stage.value === "home";
  const scope = useScope();

  return (
    <div className="flex h-screen w-screen flex-col bg-bg text-fg">
      {stage.value !== "loading" && <Header />}
      {ready && scope.kind === "project" ? (
        <div aria-hidden className="h-px shrink-0 bg-accent/60" />
      ) : null}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {ready && <Sidebar />}
        <MainContent />
      </div>
      {ready && <StatusBar />}
      {ready && <ScopeAnnouncer />}
    </div>
  );
}
