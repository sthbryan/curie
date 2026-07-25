import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import type { CustomSkillSaveResult } from "@/components/types";
import { t } from "@/i18n";
import { loadGlobalSkills } from "@/lib/boot";
import { errorMessage } from "@/lib/errors";
import { errorToast, successToast, warningToast } from "@/lib/toast";
import { lang } from "@/store/system";

export type LocalInstall = {
  installing: boolean;
  install: (name: string, content: string) => Promise<boolean>;
};

export function useLocalInstall(): LocalInstall {
  const [installing, setInstalling] = useState(false);

  const install = useCallback(async (name: string, content: string) => {
    setInstalling(true);
    try {
      const res = await invoke<CustomSkillSaveResult>("save_custom_skill", {
        name: name.trim(),
        content,
      });

      if (!res.installed) {
        warningToast({
          label: t(lang.value, "custom.local.toastNotInstalled"),
          detail: res.installMessage ?? res.path,
        });
        return false;
      }

      successToast({ label: t(lang.value, "custom.local.toastInstalled"), detail: res.name });
      await loadGlobalSkills({ checkUpdates: true });
      return true;
    } catch (e) {
      errorToast({
        label: t(lang.value, "custom.local.toastFailed"),
        detail: errorMessage(e),
      });
      return false;
    } finally {
      setInstalling(false);
    }
  }, []);

  return { installing, install };
}
