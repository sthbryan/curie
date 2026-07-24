import { type Signal, signal } from "@preact/signals";
import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";
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
  installing: Signal<boolean>;
  installError: Signal<string | null>;
  urlSuccess: Signal<string | null>;
  install: (target: string) => Promise<UrlKind | null>;
  dismissInstallError: () => void;
  dismissUrlSuccess: () => void;
  saving: Signal<boolean>;
  saveError: Signal<string | null>;
  saved: Signal<CustomSkillSaveResult | null>;
  save: (name: string, content: string) => Promise<void>;
  dismissSaveError: () => void;
  clearSaved: () => void;
};

export function useCustomActions(): CustomActions {
  const installing = signal(false);
  const installError = signal<string | null>(null);
  const urlSuccess = signal<string | null>(null);

  const saving = signal(false);
  const saveError = signal<string | null>(null);
  const saved = signal<CustomSkillSaveResult | null>(null);

  const install = useCallback(async (target: string) => {
    const kind = classifyInput(target);
    if (!kind) {
      installError.value = "expected a github.com URL or an owner/repo[@skill] package";
      return null;
    }
    installing.value = true;
    installError.value = null;
    urlSuccess.value = null;
    try {
      await invoke<SkillInstallResult>("add_skill", { package: target.trim() });
      const label = target.trim();
      urlSuccess.value = label;
      toast.success(t(lang.value, "toast.installed", { name: label }));
      await loadGlobalSkills({ checkUpdates: true });
      return kind;
    } catch (e) {
      installError.value = errorMessage(e);
      return null;
    } finally {
      installing.value = false;
    }
  }, []);

  const dismissInstallError = useCallback(() => {
    installError.value = null;
  }, []);

  const dismissUrlSuccess = useCallback(() => {
    urlSuccess.value = null;
  }, []);

  const save = useCallback(async (name: string, content: string) => {
    console.log("save", name, content);
    saving.value = true;
    saveError.value = null;
    try {
      const res = await invoke<CustomSkillSaveResult>("save_custom_skill", {
        name: name.trim(),
        content,
      });
      saved.value = res;
      urlSuccess.value = null;
      return;
    } catch (e) {
      saveError.value = errorMessage(e);
      throw e;
    } finally {
      saving.value = false;
    }
  }, []);

  const dismissSaveError = useCallback(() => {
    saveError.value = null;
  }, []);

  const clearSaved = useCallback(() => {
    saved.value = null;
  }, []);

  return {
    installing,
    installError,
    urlSuccess,
    install,
    dismissInstallError,
    dismissUrlSuccess,
    saving,
    saveError,
    saved,
    save,
    dismissSaveError,
    clearSaved,
  };
}
