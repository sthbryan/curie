import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Else, If, Then, When } from "react-if";
import { Button } from "../../components/Button";
import { Label } from "../../components/Label";
import { t } from "../../i18n";
import { addSkill, findSkills } from "../../lib/boot";
import { fadeUp } from "../../lib/motion";
import { isSearchResultInstalled } from "../../lib/skills";
import { useFindStore } from "../../store/find";
import { useSkillsStore } from "../../store/skills";
import { useUiStore } from "../../store/ui";
import { ResultsPanel } from "./components/ResultsPanel";

/** Debounce searches like the CLI (~150–350ms); cancel in-flight via request id. */
const DEBOUNCE_MS = 280;

export function Find() {
  const lang = useUiStore((s) => s.lang);
  const skills = useSkillsStore((s) => s.skills);
  const findQuery = useFindStore((s) => s.findQuery);
  const findOwner = useFindStore((s) => s.findOwner);
  const findResults = useFindStore((s) => s.findResults);
  const findLoading = useFindStore((s) => s.findLoading);
  const findError = useFindStore((s) => s.findError);
  const installingPackage = useFindStore((s) => s.installingPackage);
  const installError = useFindStore((s) => s.installError);
  const setInstallError = useFindStore((s) => s.setInstallError);
  const setFindQuery = useFindStore((s) => s.setFindQuery);
  const setFindOwner = useFindStore((s) => s.setFindOwner);

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
  const showResults = !showHint && !findLoading && findResults.length > 0;

  let statusLabel = t(lang, "find.packageHint");
  if (findLoading) statusLabel = t(lang, "find.searching");
  else if (showResults) statusLabel = t(lang, "find.results", { n: findResults.length });

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

          <When condition={Boolean(findError || installError)}>
            <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
              <div className="min-w-0 flex flex-col gap-1">
                <span className="font-mono uppercase tracking-label text-micro text-accent">
                  <If condition={Boolean(findError)}>
                    <Then>{t(lang, "find.error")}</Then>
                    <Else>{t(lang, "find.installError")}</Else>
                  </If>
                </span>
                <p className="font-body text-sm text-fg-3 break-all">{findError ?? installError}</p>
              </div>
              <Button
                size="xs"
                variant="link"
                className="shrink-0 px-0"
                onClick={() => {
                  if (installError) setInstallError(null);
                  if (findError) void findSkills(query, owner);
                }}
              >
                ×
              </Button>
            </div>
          </When>
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
            <Button
              size="lg"
              variant="primary"
              className="px-4 shrink-0"
              onClick={() => {
                void findSkills(query, owner);
              }}
              disabled={findLoading || qLen < 2}
            >
              <If condition={findLoading}>
                <Then>{t(lang, "find.searching")}</Then>
                <Else>{t(lang, "find.search")}</Else>
              </If>
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {statusLabel}
            </span>
          </div>
        </motion.section>

        <section className="flex flex-col">
          <ResultsPanel
            lang={lang}
            showHint={showHint}
            loading={findLoading}
            empty={showEmpty}
            results={findResults}
            listKey={`${query}:${owner}`}
            installedPackages={installedPackages}
            installingPackage={installingPackage}
            installBusy={installBusy}
            onInstall={handleInstall}
          />
        </section>
      </div>
    </main>
  );
}
