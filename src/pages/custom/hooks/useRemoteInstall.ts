import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { SkillInstallResult } from "@/components/types";
import { t } from "@/i18n";
import { loadSkills } from "@/lib/boot";
import { errorMessage } from "@/lib/errors";
import { promiseToast } from "@/lib/toast";
import { activeScopePath } from "@/store/skills";
import { lang } from "@/store/system";
import { classifyTarget, targetLabel } from "../lib/target";

export type RemoteInstall = {
  installing: boolean;
  install: (target: string) => Promise<boolean>;
};

export function useRemoteInstall(): RemoteInstall {
  const [installing, setInstalling] = useState(false);

  const install = useCallback(async (target: string) => {
    const trimmed = target.trim();
    if (classifyTarget(trimmed) === null) {
      toast.error(t(lang.value, "custom.remote.errorInvalid"));
      return false;
    }

    const projectPath = activeScopePath.value;
    setInstalling(true);
    const detail = targetLabel(trimmed);
    const promise = invoke<SkillInstallResult>("add_skill", {
      package: trimmed,
      skillName: null,
      projectPath,
    }).then(async (res) => {
      if (projectPath === activeScopePath.value)
        await loadSkills(projectPath, { checkUpdates: true });
      return res;
    });

    promiseToast(promise, {
      loading: { label: t(lang.value, "custom.remote.toastLoading"), detail },
      success: { label: t(lang.value, "custom.remote.toastSuccess"), detail },
      error: (e) => ({
        label: t(lang.value, "custom.remote.toastError"),
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

  return { installing, install };
}
