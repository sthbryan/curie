import { type Signal, signal } from "@preact/signals";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useMemo } from "preact/hooks";
import { toast } from "sonner";
import type { CustomSkillSaveResult, SkillInstallResult } from "@/components/types";
import { t } from "@/i18n";
import { loadGlobalSkills } from "@/lib/boot";
import { lang } from "@/store/system";

export type CustomActions = {
  installStatus: Signal<{ status: "idle" | "processing" }>;
  saveStatus: Signal<{ status: "idle" | "processing" }>;
  install: (target: string, skillName?: string | null) => Promise<UrlKind | null>;
  save: (name: string, content: string) => Promise<void>;
  cleanSaved: () => void;
  cleanInstalled: () => void;
};

export type UrlKind = "url" | "package";

function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

function repoLabel(input: string): string {
  const v = input.trim();
  const urlMatch = v.match(
    /(?:https?:\/\/|git@|ssh:\/\/)[^/]+\/([^/?#]+)\/([^/?#]+?)(?:\.git)?(?:\/.*)?$/i,
  );
  if (urlMatch) return `${urlMatch[1]}/${urlMatch[2]}`;
  const pkgMatch = v.match(/^([\w.-]+)\/([\w.-]+?)(?:@([\w.-]+))?$/);
  if (pkgMatch) {
    if (pkgMatch[3]) return `${pkgMatch[1]}/${pkgMatch[2]} · ${pkgMatch[3]}`;
    return `${pkgMatch[1]}/${pkgMatch[2]}`;
  }
  return v;
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
  const installStatus = useMemo(
    () => signal<{ status: "idle" | "processing" }>({ status: "idle" }),
    [],
  );
  const saveStatus = useMemo(
    () => signal<{ status: "idle" | "processing" }>({ status: "idle" }),
    [],
  );

  const install = useCallback(async (target: string, skillName?: string | null) => {
    const kind = classifyInput(target);
    if (!kind) {
      toast.error(t(lang.value, "custom.url.errorInvalid"));
      return null;
    }
    installStatus.value = { status: "processing" };
    const trimmed = target.trim();
    const trimmedName = skillName?.trim() || null;
    const label = repoLabel(trimmed);
    const promise = invoke<SkillInstallResult>("add_skill", {
      package: trimmed,
      skillName: trimmedName,
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
      return kind;
    } catch {
      return null;
    } finally {
      installStatus.value = { status: "idle" };
    }
  }, []);

  const save = useCallback(async (name: string, content: string) => {
    saveStatus.value = { status: "processing" };
    try {
      const res = await invoke<CustomSkillSaveResult>("save_custom_skill", {
        name: name.trim(),
        content,
      });
      if (res.installed) {
        toast.success(t(lang.value, "custom.md.successInstalled", { name: res.name }));
        await loadGlobalSkills({ checkUpdates: true });
      } else {
        toast.success(t(lang.value, "custom.md.successSaved", { name: res.name, path: res.path }));
        toast.error(t(lang.value, "custom.md.installError", { message: res.installMessage ?? "" }));
      }
      return;
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    } finally {
      saveStatus.value = { status: "idle" };
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
