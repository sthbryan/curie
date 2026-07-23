import { invoke } from "@tauri-apps/api/core";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { SkillInstallResult, SkillSearchResult } from "@/components/types";
import { t } from "@/i18n";
import { loadGlobalSkills } from "@/lib/boot";
import { lang } from "@/store/system";

function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

export type FindActions = {
  results: SkillSearchResult[];
  loading: boolean;
  error: string | null;
  installing: string | null;
  installError: string | null;
  search: (query: string, owner: string) => Promise<void>;
  install: (pkg: string) => Promise<void>;
  dismissInstallError: () => void;
};

export function useFindActions(): FindActions {
  const [results, setResults] = useState<SkillSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  const latestSearchId = useRef(0);

  const search = useCallback(async (query: string, owner: string) => {
    const q = query.trim();
    const o = owner.trim() || null;
    const id = ++latestSearchId.current;

    if (q.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await invoke<SkillSearchResult[]>("find_skills", {
        query: q,
        owner: o,
      });
      if (id !== latestSearchId.current) return;
      setResults(res);
    } catch (e) {
      if (id !== latestSearchId.current) return;
      setError(errorMessage(e));
      setResults([]);
    } finally {
      if (id === latestSearchId.current) setLoading(false);
    }
  }, []);

  const install = useCallback(async (pkg: string) => {
    setInstalling(pkg);
    setInstallError(null);
    try {
      await invoke<SkillInstallResult>("add_skill", { package: pkg });
      toast.success(t(lang.value, "toast.installed", { name: pkg }));
      await loadGlobalSkills({ checkUpdates: true });
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

  return {
    results,
    loading,
    error,
    installing,
    installError,
    search,
    install,
    dismissInstallError,
  };
}
