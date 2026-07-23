import { Header } from "@/components/Header";
import { MainContent } from "@/components/MainContent";
import { Sidebar } from "@/components/Sidebar";
import { StatusBar } from "@/components/StatusBar";
import { stage } from "@/store/system";

export function AppShell() {
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
