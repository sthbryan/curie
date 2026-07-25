import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { CustomSkillSaveResult } from "@/components/types";
import { t } from "@/i18n";
import { loadGlobalSkills } from "@/lib/boot";
import { errorMessage } from "@/lib/errors";
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
      if (res.installed) {
        toast.success(t(lang.value, "custom.local.successInstalled", { name: res.name }));
        await loadGlobalSkills({ checkUpdates: true });
      } else {
        toast.success(
          t(lang.value, "custom.local.successSaved", { name: res.name, path: res.path }),
        );
        toast.error(
          t(lang.value, "custom.local.installError", { message: res.installMessage ?? "" }),
        );
      }
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setInstalling(false);
    }
  }, []);

  return { installing, install };
}
