export type CacheEntry<T> = { at: number; value: T };

export function readCache<T>(key: string): CacheEntry<T> | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry<T>>;
    if (typeof parsed.at !== "number" || !("value" in parsed)) return null;
    return { at: parsed.at, value: parsed.value as T };
  } catch {
    // A corrupt entry is the same as no entry.
    return null;
  }
}

export function writeCache<T>(key: string, value: T, at = Date.now()) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ at, value }));
  } catch {
    // Quota or private mode: the cache is only an optimization.
  }
}

export function clearCache(key: string) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
