import { invoke } from "@tauri-apps/api/core";
import { useCallback, useRef, useState } from "react";
import type { SkillSearchResult } from "@/components/types";
import { errorMessage } from "@/lib/errors";
import { type SkillInstall, useSkillInstall } from "@/lib/useSkillInstall";

export type FindActions = SkillInstall & {
  results: SkillSearchResult[];
  loading: boolean;
  error: string | null;
  search: (query: string, owner: string) => Promise<void>;
  dismissError: () => void;
};

export function useFindActions(): FindActions {
  const [results, setResults] = useState<SkillSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { installing, installError, install, dismissInstallError } = useSkillInstall();

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

  const dismissError = useCallback(() => {
    setError(null);
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
    dismissError,
  };
}
