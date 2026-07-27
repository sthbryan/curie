import { invoke } from "@tauri-apps/api/core";
import { useCallback, useRef, useState } from "react";
import type { ExplorePage, ExploreView, SkillExploreResult } from "@/components/types";
import { errorMessage } from "@/lib/errors";
import { type SkillInstall, useSkillInstall } from "@/lib/useSkillInstall";

export type ExploreActions = SkillInstall & {
  skills: SkillExploreResult[];
  view: ExploreView;
  total: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  setView: (view: ExploreView) => void;
  load: (view?: ExploreView) => Promise<void>;
  loadMore: () => Promise<void>;
  dismissError: () => void;
};

export function useExploreActions(initialView: ExploreView = "hot"): ExploreActions {
  const [skills, setSkills] = useState<SkillExploreResult[]>([]);
  const [view, setViewState] = useState<ExploreView>(initialView);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { installing, installError, install, dismissInstallError } = useSkillInstall();

  const latestLoadId = useRef(0);
  const viewRef = useRef(view);
  viewRef.current = view;

  const applyPage = useCallback((res: ExplorePage, append: boolean) => {
    setSkills((prev) => (append ? [...prev, ...res.skills] : res.skills));
    setTotal(res.total);
    setHasMore(res.hasMore);
    setPage(res.page);
  }, []);

  const load = useCallback(
    async (nextView?: ExploreView) => {
      const v = nextView ?? viewRef.current;
      const id = ++latestLoadId.current;
      setLoading(true);
      setError(null);
      try {
        const res = await invoke<ExplorePage>("explore_skills", { view: v, page: 0 });
        if (id !== latestLoadId.current) return;
        applyPage(res, false);
      } catch (e) {
        if (id !== latestLoadId.current) return;
        setError(errorMessage(e));
        setSkills([]);
        setTotal(0);
        setHasMore(false);
        setPage(0);
      } finally {
        if (id === latestLoadId.current) setLoading(false);
      }
    },
    [applyPage],
  );

  const setView = useCallback(
    (next: ExploreView) => {
      setViewState(next);
      viewRef.current = next;
      void load(next);
    },
    [load],
  );

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const id = latestLoadId.current;
    const nextPage = page + 1;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await invoke<ExplorePage>("explore_skills", {
        view: viewRef.current,
        page: nextPage,
      });
      if (id !== latestLoadId.current) return;
      applyPage(res, true);
    } catch (e) {
      if (id !== latestLoadId.current) return;
      setError(errorMessage(e));
    } finally {
      if (id === latestLoadId.current) setLoadingMore(false);
    }
  }, [applyPage, hasMore, loading, loadingMore, page]);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    skills,
    view,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    installing,
    installError,
    setView,
    load,
    loadMore,
    install,
    dismissInstallError,
    dismissError,
  };
}
