import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "../../components/Label";
import { t } from "../../i18n";
import { addSkill, findSkills } from "../../lib/boot";
import { fadeUp, listStagger } from "../../lib/motion";
import { isSearchResultInstalled } from "../../lib/skills";
import { useAppStore } from "../../store/app";
import { ResultRow } from "./components/ResultRow";

const DEBOUNCE_MS = 280;

export function Find() {
  const lang = useAppStore((s) => s.lang);
  const skills = useAppStore((s) => s.skills);
  const findQuery = useAppStore((s) => s.findQuery);
  const findOwner = useAppStore((s) => s.findOwner);
  const findResults = useAppStore((s) => s.findResults);
  const findLoading = useAppStore((s) => s.findLoading);
  const findError = useAppStore((s) => s.findError);
  const installingPackage = useAppStore((s) => s.installingPackage);
  const installError = useAppStore((s) => s.installError);
  const setInstallError = useAppStore((s) => s.setInstallError);
  const setFindQuery = useAppStore((s) => s.setFindQuery);
  const setFindOwner = useAppStore((s) => s.setFindOwner);

  const [query, setQuery] = useState(findQuery);
  const [owner, setOwner] = useState(findOwner);
  const inputRef = useRef<HTMLInputElement>(null);
  const installBusy = installingPackage !== null;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void findSkills(query, owner);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query, owner]);

  const installedPackages = useMemo(
    () =>
      new Set(findResults.filter((r) => isSearchResultInstalled(r, skills)).map((r) => r.package)),
    [findResults, skills],
  );

  const handleInstall = (pkg: string) => {
    addSkill(pkg).catch(() => {
      // store keeps installError
    });
  };

  const qLen = query.trim().length;
  const showHint = qLen < 2;
  const showEmpty = !showHint && !findLoading && !findError && findResults.length === 0;
  const showResults = !showHint && findResults.length > 0;

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-10 pt-12 pb-8">
        <motion.section {...fadeUp(0)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label lang={lang}>{t(lang, "find.eyebrow")}</Label>
            <h2 className="font-display text-heading font-bold tracking-tight text-fg">
              {t(lang, "find.title")}
            </h2>
            <p className="font-body text-sm text-fg-3 max-w-lg">{t(lang, "find.subtitle")}</p>
          </div>

          {(findError || installError) && (
            <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
              <div className="min-w-0 flex flex-col gap-1">
                <span className="font-mono uppercase tracking-label text-micro text-accent">
                  {findError ? t(lang, "find.error") : t(lang, "find.installError")}
                </span>
                <p className="font-body text-sm text-fg-3 break-all">{findError ?? installError}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (installError) setInstallError(null);
                  if (findError) void findSkills(query, owner);
                }}
                className="shrink-0 font-mono uppercase tracking-label text-micro text-fg-3 hover:text-fg"
              >
                ×
              </button>
            </div>
          )}
        </motion.section>

        <motion.section {...fadeUp(0.05)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex min-w-0 flex-1">
              <span className="sr-only">{t(lang, "find.query")}</span>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setFindQuery(e.target.value);
                }}
                placeholder={t(lang, "find.queryPlaceholder")}
                className="h-10 w-full border border-border-strong bg-bg px-3 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm"
              />
            </label>
            <label className="relative flex w-full sm:w-48 shrink-0">
              <span className="sr-only">{t(lang, "find.owner")}</span>
              <input
                type="text"
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  setFindOwner(e.target.value);
                }}
                placeholder={t(lang, "find.ownerPlaceholder")}
                spellCheck={false}
                className="h-10 w-full border border-border-strong bg-bg px-3 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                void findSkills(query, owner);
              }}
              disabled={findLoading || qLen < 2}
              className="h-10 px-4 bg-fg text-bg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:opacity-90 disabled:opacity-50 transition-opacity duration-150 shrink-0"
            >
              {findLoading ? t(lang, "find.searching") : t(lang, "find.search")}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {findLoading
                ? t(lang, "find.searching")
                : showResults
                  ? t(lang, "find.results", { n: findResults.length })
                  : t(lang, "find.packageHint")}
            </span>
          </div>
        </motion.section>

        <section className="flex flex-col">
          {showHint ? (
            <motion.div {...fadeUp(0.08)} className="border-t border-border py-8">
              <p className="font-body text-sm text-fg-3">{t(lang, "find.hint")}</p>
            </motion.div>
          ) : findLoading && findResults.length === 0 ? (
            <motion.div {...fadeUp(0.08)} className="border-t border-border py-8">
              <span className="font-mono uppercase tracking-label text-mono text-fg-3 animate-pulse">
                {t(lang, "find.searching")}
              </span>
            </motion.div>
          ) : showEmpty ? (
            <motion.div
              {...fadeUp(0.08)}
              className="flex flex-col gap-2 border border-border-strong bg-surface-tint px-5 py-8"
            >
              <span className="font-body text-sm text-fg">{t(lang, "find.empty")}</span>
              <p className="font-body text-sm text-fg-3">{t(lang, "find.emptyHint")}</p>
            </motion.div>
          ) : showResults ? (
            <>
              <motion.div
                {...fadeUp(0.06)}
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_4.5rem_7rem] gap-4 border-b border-border pb-2"
              >
                <span className="font-mono uppercase tracking-label text-micro text-fg-4">
                  {t(lang, "find.colName")}
                </span>
                <span className="font-mono uppercase tracking-label text-micro text-fg-4">
                  {t(lang, "find.colSource")}
                </span>
                <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
                  {t(lang, "find.colInstalls")}
                </span>
                <span className="font-mono uppercase tracking-label text-micro text-fg-4 text-right">
                  {t(lang, "find.colActions")}
                </span>
              </motion.div>
              <motion.div
                key={`${query}:${owner}`}
                className="flex flex-col"
                variants={listStagger}
                initial="initial"
                animate="animate"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {findResults.map((result) => (
                    <ResultRow
                      key={result.id}
                      result={result}
                      lang={lang}
                      installed={installedPackages.has(result.package)}
                      installing={installingPackage === result.package}
                      installBusy={installBusy}
                      onInstall={handleInstall}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
