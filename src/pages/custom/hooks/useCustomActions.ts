import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { CustomSkillSaveResult, SkillInstallResult } from "@/components/types";
import { t } from "@/i18n";
import { loadGlobalSkills } from "@/lib/boot";
import { lang } from "@/store/system";

function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

export type UrlKind = "url" | "package";

export function classifyInput(input: string): UrlKind | null {
  const v = input.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return "url";
  if (/^git@/i.test(v)) return "url";
  if (/^ssh:\/\//i.test(v)) return "url";
  if (/^[\w.-]+\/[\w.-]+(@[\w.-]+)?$/.test(v)) return "package";
  return null;
}

export type CustomActions = {
  installing: boolean;
  installError: string | null;
  urlSuccess: string | null;
  install: (target: string) => Promise<UrlKind | null>;
  dismissInstallError: () => void;
  saving: boolean;
  saveError: string | null;
  saved: CustomSkillSaveResult | null;
  save: (name: string, content: string) => Promise<void>;
  dismissSaveError: () => void;
  clearSaved: () => void;
};

export function useCustomActions(): CustomActions {
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [urlSuccess, setUrlSuccess] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<CustomSkillSaveResult | null>(null);

  const install = useCallback(async (target: string) => {
    const kind = classifyInput(target);
    if (!kind) {
      setInstallError("expected a github.com URL or an owner/repo[@skill] package");
      return null;
    }
    setInstalling(true);
    setInstallError(null);
    setUrlSuccess(null);
    try {
      await invoke<SkillInstallResult>("add_skill", { package: target.trim() });
      const label = target.trim();
      setUrlSuccess(label);
      toast.success(t(lang.value, "toast.installed", { name: label }));
      await loadGlobalSkills({ checkUpdates: true });
      return kind;
    } catch (e) {
      setInstallError(errorMessage(e));
      return null;
    } finally {
      setInstalling(false);
    }
  }, []);

  const dismissInstallError = useCallback(() => {
    setInstallError(null);
  }, []);

  const save = useCallback(async (name: string, content: string) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await invoke<CustomSkillSaveResult>("save_custom_skill", {
        name: name.trim(),
        content,
      });
      setSaved(res);
      setUrlSuccess(null);
      return;
    } catch (e) {
      setSaveError(errorMessage(e));
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  const dismissSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  const clearSaved = useCallback(() => {
    setSaved(null);
  }, []);

  return {
    installing,
    installError,
    urlSuccess,
    install,
    dismissInstallError,
    saving,
    saveError,
    saved,
    save,
    dismissSaveError,
    clearSaved,
  };
}
