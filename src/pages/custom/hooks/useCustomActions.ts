import { type Signal, signal } from "@preact/signals";
import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "preact/hooks";
import { toast } from "sonner";
import type { CustomSkillSaveResult, SkillInstallResult } from "@/components/types";
import { t } from "@/i18n";
import { loadGlobalSkills } from "@/lib/boot";
import { lang } from "@/store/system";

export type CustomActions = {
  installStatus: Signal<{ status: "idle" | "processing" }>;
  saveStatus: Signal<{ status: "idle" | "processing" }>;
  install: (target: string) => Promise<UrlKind | null>;
  save: (name: string, content: string) => Promise<void>;
  cleanSaved: () => void;
  cleanInstalled: () => void;
};

export type UrlKind = "url" | "package";

function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

export function classifyInput(input: string): UrlKind | null {
  const v = input.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return "url";
  if (/^git@/i.test(v)) return "url";
  if (/^ssh:\/\//i.test(v)) return "url";
  if (/^[\w.-]+\/[\w.-]+(@[\w.-]+)?$/.test(v)) return "package";
  return null;
}

export function useCustomActions(): CustomActions {
  const installStatus = signal<{ status: "idle" | "processing" }>({ status: "idle" });
  const saveStatus = signal<{ status: "idle" | "processing" }>({ status: "idle" });

  const install = useCallback(async (target: string) => {
    const kind = classifyInput(target);
    if (!kind) {
      const message = t(lang.value, "custom.url.errorInvalid");
      toast.error(message);
      return null;
    }
    installStatus.value = { status: "processing" };
    try {
      await invoke<SkillInstallResult>("add_skill", { package: target.trim() });
      const label = target.trim();
      toast.success(t(lang.value, "toast.installed", { name: label }));
      await loadGlobalSkills({ checkUpdates: true });
      return kind;
    } catch (e) {
      const message = errorMessage(e);
      toast.error(message);
      return null;
    } finally {
      setTimeout(() => {
        installStatus.value = { status: "idle" };
      }, 2500);
    }
  }, []);

  const save = useCallback(async (name: string, content: string) => {
    saveStatus.value = { status: "processing" };
    try {
      const res = await invoke<CustomSkillSaveResult>("save_custom_skill", {
        name: name.trim(),
        content,
      });
      toast.success(t(lang.value, "custom.md.success", { name: res.name }));
      return;
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    } finally {
      setTimeout(() => {
        saveStatus.value = { status: "idle" };
      }, 2500);
    }
  }, []);

  const cleanSaved = useCallback(() => {
    saveStatus.value = { status: "idle" };
  }, []);

  const cleanInstalled = useCallback(() => {
    installStatus.value = { status: "idle" };
  }, []);

  return {
    installStatus,
    saveStatus,
    install,
    save,
    cleanSaved,
    cleanInstalled,
  };
}
