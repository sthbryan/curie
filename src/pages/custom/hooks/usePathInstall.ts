import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";

import type { CustomSkillInstallResult } from "@/components/types";
import { t } from "@/i18n";
import { loadSkills } from "@/lib/boot";
import { errorMessage } from "@/lib/errors";
import { promiseToast } from "@/lib/toast";
import { activeScopePath } from "@/store/skills";
import { lang } from "@/store/system";

function leaf(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

export type PathInstall = {
  installing: boolean;
  installPath: (path: string) => Promise<boolean>;
};

export function usePathInstall(): PathInstall {
  const [installing, setInstalling] = useState(false);

  const installPath = useCallback(async (path: string) => {
    const projectPath = activeScopePath.value;
    setInstalling(true);
    const detail = leaf(path);
    const promise = invoke<CustomSkillInstallResult>("install_custom_skill_path", {
      path,
      projectPath,
    }).then(async (res) => {
      if (projectPath === activeScopePath.value)
        await loadSkills(projectPath, { checkUpdates: true, freshUpdates: true });
      return res;
    });

    promiseToast(promise, {
      loading: { label: t(lang.value, "custom.local.toastLoading"), detail },
      success: { label: t(lang.value, "custom.local.toastSuccess"), detail },
      error: (e) => ({
        label: t(lang.value, "custom.local.toastError"),
        detail: errorMessage(e),
      }),
    });

    try {
      await promise;
      return true;
    } catch {
      return false;
    } finally {
      setInstalling(false);
    }
  }, []);

  return { installing, installPath };
}
