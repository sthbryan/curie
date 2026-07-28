import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { SkillInstallResult } from "@/components/types";
import { t } from "@/i18n";
import { loadSkills } from "@/lib/boot";
import { errorMessage } from "@/lib/errors";
import { activeScopePath } from "@/store/skills";
import { lang } from "@/store/system";

export type SkillInstall = {
  installing: string | null;
  installError: string | null;
  install: (pkg: string) => Promise<void>;
  dismissInstallError: () => void;
};

export function useSkillInstall(): SkillInstall {
  const [installing, setInstalling] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  const install = useCallback(async (pkg: string) => {
    const projectPath = activeScopePath.value;
    setInstalling(pkg);
    setInstallError(null);
    try {
      await invoke<SkillInstallResult>("add_skill", { package: pkg, projectPath });
      toast.success(t(lang.value, "toast.installed", { name: pkg }));
      if (projectPath === activeScopePath.value)
        await loadSkills(projectPath, { checkUpdates: true });
    } catch (e) {
      setInstallError(errorMessage(e));
      throw e;
    } finally {
      setInstalling(null);
    }
  }, []);

  const dismissInstallError = useCallback(() => {
    setInstallError(null);
  }, []);

  return { installing, installError, install, dismissInstallError };
}
