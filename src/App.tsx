import { invoke } from "@tauri-apps/api/core";
import { toast } from "@zovaris/sephiro/toast";
import { useEffect, useRef } from "react";

import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/Toaster";
import { t } from "@/i18n";
import { useBoot } from "@/lib/boot";
import { useRoute } from "@/lib/routes";
import { markViewTransitionSupport } from "@/lib/viewTransition";
import { skillUpdates } from "@/store/skills";
import { lang, reducedMotion, resolvedMode, theme } from "@/store/system";
import { appUpdate } from "@/store/update";

function App() {
  useBoot();
  const { navigate } = useRoute();

  useEffect(() => {
    markViewTransitionSupport();
  }, []);

  // The native window starts hidden; reveal it once the shell is committed so
  // the first frame is the app and not an empty plate. This runs directly from
  // the effect because a hidden webview may not run animation frames, and Rust
  // reveals the window after 3s if this never gets called.
  useEffect(() => {
    void invoke("show_main_window").catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-sephiro-theme", theme.value);
    // The family ships both palettes; this is the one `auto` resolved to.
    document.documentElement.setAttribute("data-theme", resolvedMode.value);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reading .value is how signals re-run the effect
  }, [theme.value, resolvedMode.value]);

  useEffect(() => {
    document.documentElement.lang = lang.value;
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reading .value is how signals re-run the effect
  }, [lang.value]);

  useEffect(() => {
    document.documentElement.setAttribute("data-reduced-motion", reducedMotion.value);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reading .value is how signals re-run the effect
  }, [reducedMotion.value]);

  const notifiedUpdates = useRef(false);
  useEffect(() => {
    if (skillUpdates.value.length > 0 && !notifiedUpdates.current) {
      notifiedUpdates.current = true;
      const n = skillUpdates.value.filter((u) => u.updateAvailable).length;
      if (n > 0) toast.success(t(lang.value, "toast.updates", { n }));
    }
  });

  const notifiedAppUpdate = useRef(false);
  useEffect(() => {
    if (appUpdate.value?.updateAvailable && !notifiedAppUpdate.current) {
      notifiedAppUpdate.current = true;
      toast.info(t(lang.value, "toast.appUpdate"), {
        action: {
          label: t(lang.value, "toast.appUpdateAction"),
          onClick: () => {
            navigate("/settings");
          },
        },
      });
    }
  });

  return (
    <>
      <AppShell />
      <Toaster />
    </>
  );
}

export default App;
