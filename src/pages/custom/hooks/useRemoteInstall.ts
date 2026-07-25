import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { SkillInstallResult } from "@/components/types";
import { t } from "@/i18n";
import { loadGlobalSkills } from "@/lib/boot";
import { errorMessage } from "@/lib/errors";
import { lang } from "@/store/system";
import { classifyTarget, targetLabel } from "../lib/target";

export type SkillInstall = {
  installing: boolean;
  install: (target: string) => Promise<boolean>;
};

export function useSkillInstall(): SkillInstall {
  const [installing, setInstalling] = useState(false);

  const install = useCallback(async (target: string) => {
    const trimmed = target.trim();
    if (classifyTarget(trimmed) === null) {
      toast.error(t(lang.value, "custom.url.errorInvalid"));
      return false;
    }

    setInstalling(true);
    const label = targetLabel(trimmed);
    const promise = invoke<SkillInstallResult>("add_skill", {
      package: trimmed,
      skillName: null,
    }).then(async (res) => {
      await loadGlobalSkills({ checkUpdates: true });
      return res;
    });

    toast.promise(promise, {
      loading: t(lang.value, "custom.url.promiseLoading", { target: label }),
      success: () => t(lang.value, "custom.url.promiseSuccess", { target: label }),
      error: (e: unknown) => errorMessage(e),
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
