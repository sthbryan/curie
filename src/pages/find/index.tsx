import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Else, If, Then, When } from "react-if";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { isSearchResultInstalled } from "@/lib/skills";
import { skills } from "@/store/skills";
import { ResultsPanel } from "./components/ResultsPanel";
import { useFindActions } from "./hooks/useFindActions";

const DEBOUNCE_MS = 280;

export function Find() {
  const t = useT("find");
  const {
    results: findResults,
    loading: findLoading,
    error: findError,
    installing: installingPackage,
    installError,
    search: runSearch,
    install: runInstall,
    dismissInstallError,
  } = useFindActions();

  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const installBusy = installingPackage !== null;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runSearch(query, owner);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query, owner, runSearch]);

  const installedPackages = useMemo(
    () =>
      new Set(
        findResults.filter((r) => isSearchResultInstalled(r, skills.value)).map((r) => r.package),
      ),
    [findResults, skills.value],
  );

  const handleInstall = (pkg: string) => {
    runInstall(pkg).catch(() => {
      // hook keeps installError
    });
  };

  const qLen = query.trim().length;
  const showHint = qLen < 2;
  const showEmpty = !showHint && !findLoading && !findError && findResults.length === 0;
  const showResults = !showHint && !findLoading && findResults.length > 0;

  let statusLabel = t("packageHint");
  if (findLoading) statusLabel = t("searching");
  else if (showResults) statusLabel = t("results", { n: findResults.length });

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-10 pt-12 pb-8">
        <motion.section {...fadeUp(0)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label>{t("eyebrow")}</Label>
            <h2 className="font-display text-heading font-bold tracking-tight text-fg">
              {t("title")}
            </h2>
            <p className="font-body text-sm text-fg-3 max-w-lg">{t("subtitle")}</p>
          </div>

          <When condition={Boolean(findError || installError)}>
            <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
              <div className="min-w-0 flex flex-col gap-1">
                <span className="font-mono uppercase tracking-label text-micro text-accent">
                  <If condition={Boolean(findError)}>
                    <Then>{t("error")}</Then>
                    <Else>{t("installError")}</Else>
                  </If>
                </span>
                <p className="font-body text-sm text-fg-3 break-all">{findError ?? installError}</p>
              </div>
              <Button
                size="xs"
                variant="link"
                className="shrink-0 px-0"
                onClick={() => {
                  if (installError) dismissInstallError();
                  if (findError) void runSearch(query, owner);
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
              <span className="sr-only">{t("query")}</span>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                placeholder={t("queryPlaceholder")}
                className="h-10 w-full border border-border-strong bg-bg px-3 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm"
              />
            </label>
            <label className="relative flex w-full sm:w-48 shrink-0">
              <span className="sr-only">{t("owner")}</span>
              <input
                type="text"
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                }}
                placeholder={t("ownerPlaceholder")}
                spellCheck={false}
                className="h-10 w-full border border-border-strong bg-bg px-3 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm"
              />
            </label>
            <Button
              size="lg"
              variant="primary"
              className="px-4 shrink-0"
              onClick={() => {
                void runSearch(query, owner);
              }}
              disabled={findLoading || qLen < 2}
            >
              <If condition={findLoading}>
                <Then>{t("searching")}</Then>
                <Else>{t("search")}</Else>
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
            showHint={showHint}
            loading={findLoading}
            empty={showEmpty}
            results={findResults}
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
