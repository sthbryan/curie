import { CircleFadingArrowUp, LoaderCircle } from "lucide-react";
import { useReducedMotionConfig } from "motion/react";
import { useLocation } from "wouter";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { skillsLoading, skillUpdates, updatesLoading } from "@/store/skills";

const CHIP = "flex items-center gap-2 font-mono uppercase tracking-label text-micro";

export function HeaderActivity() {
  const t = useT("app");
  const [location, navigate] = useLocation();
  const shouldReduceMotion = useReducedMotionConfig();

  const busyKey = skillsLoading.value
    ? "loadingSkills"
    : updatesLoading.value
      ? "checkingUpdates"
      : null;

  if (busyKey) {
    return (
      <span className={cn(CHIP, "text-fg-3")} aria-live="polite">
        <LoaderCircle
          size={11}
          className={cn("text-fg-4", !shouldReduceMotion && "animate-spin")}
          aria-hidden
        />
        {t(busyKey)}
      </span>
    );
  }

  const outdated = skillUpdates.value.filter((entry) => entry.updateAvailable).length;
  if (outdated === 0 || location === "/installed") return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/installed")}
      className={cn(CHIP, "cursor-pointer text-accent hover:underline")}
    >
      <CircleFadingArrowUp size={11} aria-hidden />
      {t("skillUpdates", { n: outdated })}
    </button>
  );
}
