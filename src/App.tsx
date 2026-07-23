import { MotionConfig } from "motion/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/Toaster";
import { t } from "@/i18n";
import { useBoot } from "@/lib/boot";
import { skillUpdates } from "@/store/skills";
import { lang, reducedMotion, theme } from "@/store/system";

function App() {
  useBoot();
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme.value);
  }, [theme.value]);

  useEffect(() => {
    document.documentElement.lang = lang.value;
  }, [lang.value]);

  const notifiedUpdates = useRef(false);
  useEffect(() => {
    if (skillUpdates.value.length > 0 && !notifiedUpdates.current) {
      notifiedUpdates.current = true;
      const n = skillUpdates.value.filter((u) => u.updateAvailable).length;
      if (n > 0) toast.success(t(lang.value, "toast.updates", { n }));
    }
  });

  return (
    <MotionConfig reducedMotion={reducedMotion.value}>
      <AppShell />
      <Toaster />
    </MotionConfig>
  );
}

export default App;
