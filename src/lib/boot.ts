import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";

import type {
  AppUpdateInfo,
  InstallResult,
  NodeInfo,
  SkillInfo,
  SkillUpdateInfo,
} from "@/components/types";
import { detectLang } from "@/i18n";
import { readCache, writeCache } from "@/lib/cache";
import { errorMessage } from "@/lib/errors";
import { loadProjects, refreshAllSummaries } from "@/lib/projects";
import { readSettings, resolveSettings, writeSettings } from "@/lib/settings";
import {
  setSkills,
  setSkillsError,
  setSkillsLoading,
  setSkillUpdates,
  setUpdatesError,
  setUpdatesLoading,
  skillsScope,
} from "@/store/skills";
import {
  applySettings,
  colorMode,
  hasBooted,
  lang,
  markBooted,
  markHydrated,
  reducedMotion,
  setLang,
  setNode,
  setStage,
  sidebarOpen,
  theme,
} from "@/store/system";
import {
  setAppInstallRunning,
  setAppUpdate,
  setAppUpdateError,
  setAppUpdateLoading,
} from "@/store/update";

export async function checkAppUpdate() {
  setAppUpdateLoading(true);
  setAppUpdateError(null);
  try {
    const info = await invoke<AppUpdateInfo>("check_app_update");
    setAppUpdate(info);
  } catch (e) {
    setAppUpdateError(errorMessage(e));
  } finally {
    setAppUpdateLoading(false);
  }
}

export async function installAppUpdate(): Promise<InstallResult | null> {
  setAppInstallRunning(true);
  try {
    return await invoke<InstallResult>("install_app_update");
  } catch (e) {
    return {
      success: false,
      message: errorMessage(e),
      fallbackUrl: "https://github.com/sthbryan/curie/releases/latest",
    };
  } finally {
    setAppInstallRunning(false);
  }
}

export const RESTART_DELAY = 1200;

const UPDATES_TTL = 30 * 60_000;

const scopeCacheKey = (prefix: string, projectPath: string | null) =>
  `${prefix}:${projectPath ?? "global"}`;

const skillsCacheKey = (projectPath: string | null) =>
  scopeCacheKey("curie.cache.skills", projectPath);

const updatesCacheKey = (projectPath: string | null) =>
  scopeCacheKey("curie.cache.updates", projectPath);

const isActiveScope = (projectPath: string | null) =>
  skillsScope.value === (projectPath === null ? "global" : `project:${projectPath}`);

export async function restartApp() {
  try {
    await invoke("restart_app");
  } catch {
    // the process is going away — nothing to report
  }
}

let loadToken = 0;
let updatesToken = 0;

/** What a caller can report: a fresh answer, the cached one, a newer check
 * that took over, or a failed round trip. */
export type UpdatesCheck = "ok" | "cached" | "superseded" | "failed";

export async function checkSkillUpdates(
  projectPath: string | null = null,
  options?: { fresh?: boolean },
): Promise<UpdatesCheck> {
  const fresh = options?.fresh ?? false;
  const key = updatesCacheKey(projectPath);
  const cached = readCache<SkillUpdateInfo[]>(key);
  const hasCache = Boolean(cached && Array.isArray(cached.value));

  // Stale-while-revalidate: the last result paints immediately, and the
  // network is only touched when the user asks or the TTL has passed.
  if (hasCache && cached) {
    setSkillUpdates(cached.value);
    if (!fresh && Date.now() - cached.at < UPDATES_TTL) return "cached";
  }

  const token = ++updatesToken;
  setUpdatesLoading(true);
  setUpdatesError(null);
  try {
    const updates = await invoke<SkillUpdateInfo[]>("check_skill_updates", { projectPath, fresh });
    if (token !== updatesToken) return "superseded";
    setSkillUpdates(updates);
    writeCache(key, updates);
    return "ok";
  } catch (e) {
    if (token !== updatesToken) return "superseded";
    // With a cached list on screen, an offline check is not worth an error card.
    if (!hasCache) setUpdatesError(errorMessage(e));
    return "failed";
  } finally {
    if (token === updatesToken) setUpdatesLoading(false);
  }
}

export async function loadSkills(
  projectPath: string | null = null,
  options?: { checkUpdates?: boolean; freshUpdates?: boolean },
) {
  const token = ++loadToken;
  const checkUpdates = options?.checkUpdates ?? true;
  const key = skillsCacheKey(projectPath);
  const cached = readCache<SkillInfo[]>(key);

  // Paint the last known list on the first frame, then refresh underneath.
  if (cached && Array.isArray(cached.value) && isActiveScope(projectPath)) {
    setSkills(cached.value);
  }

  setSkillsLoading(true);
  setSkillsError(null);
  // The list and the update check are independent round trips.
  if (checkUpdates) void checkSkillUpdates(projectPath, { fresh: options?.freshUpdates });
  try {
    const skills = await invoke<SkillInfo[]>("list_skills", { projectPath });
    if (token !== loadToken) return;
    setSkills(skills);
    writeCache(key, skills);
  } catch (e) {
    if (token !== loadToken) return;
    setSkillsError(errorMessage(e));
  } finally {
    if (token === loadToken) setSkillsLoading(false);
  }
}

export function useBoot() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const file = await readSettings();
      if (cancelled) return;
      if (file) {
        const cached = {
          theme: theme.value,
          colorMode: colorMode.value,
          sidebarOpen: sidebarOpen.value,
          lang: lang.value,
          reducedMotion: reducedMotion.value,
          hasBooted: hasBooted.value,
        };
        if (file.version === 0) {
          void writeSettings(cached).catch(() => {});
        } else {
          applySettings(resolveSettings(file, cached));
        }
      }
      markHydrated();

      // The language and the Node probe are independent. Both land before the
      // first real screen, so the shell never flips language under the user.
      const localeTask = hasBooted.value
        ? null
        : invoke<string>("get_locale").then(
            (locale) => locale,
            () => null,
          );
      const nodeTask = invoke<NodeInfo>("detect_node").then(
        (info) => ({ ok: true as const, info }),
        () => ({ ok: false as const }),
      );

      const [locale, detected] = await Promise.all([localeTask, nodeTask]);
      if (cancelled) return;
      if (locale) setLang(detectLang(locale));

      if (detected.ok) {
        setNode(detected.info);
        setStage(detected.info.installed ? "home" : "setup");
        if (detected.info.installed) {
          // Nothing here waits on anything else: the installed list, its update
          // check and the app update are independent round trips.
          void loadProjects().then(() => refreshAllSummaries());
          void loadSkills();
          void checkAppUpdate();
        }
      } else {
        setStage("setup");
      }

      markBooted();
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
