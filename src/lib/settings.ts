import { invoke } from "@tauri-apps/api/core";
import type { ReducedMotionPref, Settings, ThemeMode } from "@/components/types";
import { REDUCED_MOTION_OPTIONS, THEME_OPTIONS } from "@/components/types";
import type { Lang } from "@/i18n";

export type SettingsPatch = Omit<Settings, "version">;

const LANGS: Lang[] = ["en", "es"];

function isTheme(value: unknown): value is ThemeMode {
  return THEME_OPTIONS.some((opt) => opt.id === value);
}

function isLang(value: unknown): value is Lang {
  return LANGS.some((l) => l === value);
}

function isReducedMotion(value: unknown): value is ReducedMotionPref {
  return REDUCED_MOTION_OPTIONS.some((p) => p === value);
}

export async function readSettings(): Promise<Settings | null> {
  try {
    return await invoke<Settings>("read_settings");
  } catch {
    return null;
  }
}

export async function writeSettings(next: SettingsPatch): Promise<void> {
  await invoke("write_settings", { settings: next });
}

export function resolveSettings(file: Settings, cached: SettingsPatch): SettingsPatch {
  return {
    theme: isTheme(file.theme) ? file.theme : cached.theme,
    lang: isLang(file.lang) ? file.lang : cached.lang,
    reducedMotion: isReducedMotion(file.reducedMotion) ? file.reducedMotion : cached.reducedMotion,
    hasBooted: file.hasBooted || cached.hasBooted,
  };
}
