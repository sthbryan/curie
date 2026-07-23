import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useBoot } from "@/lib/boot";
import { lang, reducedMotion, theme } from "@/store/system";

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
