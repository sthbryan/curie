import { motion } from "motion/react";
import { toast } from "sonner";
import { FullPageError } from "@/components/FullPageError";
import { FullPageLoading } from "@/components/FullPageLoading";
import { useT } from "@/i18n";
import { loadSkills } from "@/lib/boot";
import { fadeUp } from "@/lib/motion";
import { skillsError, skillsLoading } from "@/store/skills";
import { AgentsCard } from "./components/AgentsCard";
import { HomeIntro } from "./components/HomeIntro";
import { ProjectsCard } from "./components/ProjectsCard";
import { RecentCard } from "./components/RecentCard";
import { UpdatesCard } from "./components/UpdatesCard";
import { totalSkills } from "./lib/derived";

export function Home() {
  const t = useT();

  if (skillsLoading.value && totalSkills.value === 0) {
    return <FullPageLoading />;
  }

  if (skillsError.value && totalSkills.value === 0) {
    const retry = async () => {
      await loadSkills();
      toast.success(t("toast.refreshed"));
    };
    return <FullPageError message={skillsError.value} onRetry={retry} />;
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-10 pt-12 pb-8">
        <HomeIntro />

        <motion.div {...fadeUp(0.05)} className="flex flex-col gap-10">
          <AgentsCard />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
            <UpdatesCard />
            <RecentCard />
          </div>
          <ProjectsCard />
        </motion.div>
      </div>
    </main>
  );
}
