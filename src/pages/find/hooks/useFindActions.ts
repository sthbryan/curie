import { invoke } from "@tauri-apps/api/core";
import { useCallback, useRef, useState } from "react";
import type { SkillInstallResult, SkillSearchResult } from "@/components/types";
import { loadGlobalSkills } from "@/lib/boot";

function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

export type FindActions = {
  results: SkillSearchResult[];
  loading: boolean;
  error: string | null;
  /** Package currently being installed, or null when idle. */
  installing: string | null;
  installError: string | null;
  search: (query: string, owner: string) => Promise<void>;
  install: (pkg: string) => Promise<void>;
  /** Dismiss install error (search errors retry on dismiss instead). */
  dismissInstallError: () => void;
};

/**
 * Owns the search + install action state for the Find page. Replaces what
 * was a global useFindStore. Keeps request-id cancellation so a slow in-
 * flight search doesn't clobber a newer one.
 */
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
