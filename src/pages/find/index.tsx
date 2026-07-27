import { X } from "lucide-react";
import { motion } from "motion/react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { When } from "react-if";
import { useLocation } from "wouter";
import { Button } from "@/components/Button";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Input } from "@/components/Input";
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
  const [, navigate] = useLocation();
  const {
    results: findResults,
    loading: findLoading,
    error: findError,
    installing: installingPackage,
    installError,
    search: runSearch,
    install: runInstall,
    dismissInstallError,
    dismissError,
  } = useFindActions();

  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef(0);
  const installBusy = installingPackage !== null;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    debounce.current = window.setTimeout(() => {
      void runSearch(query, owner);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(debounce.current);
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

  const handleSearch = () => {
    window.clearTimeout(debounce.current);
    void runSearch(query, owner);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleSearch();
  };

  const handleGoExplore = () => navigate("/marketplace");

  const handleClear = () => {
    setQuery("");
    setOwner("");
    inputRef.current?.focus();
  };

  const qLen = query.trim().length;
  const showHint = qLen < 2;
  const showEmpty = !showHint && !findLoading && !findError && findResults.length === 0;
  const showResults = !showHint && !findLoading && findResults.length > 0;

  let statusLabel = t("packageHint");
  if (findLoading) statusLabel = t("searching");
  else if (showResults) statusLabel = t("results", { n: findResults.length });

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-8 px-10 pt-12 pb-8">
        <motion.section {...fadeUp(0)} className="flex shrink-0 flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label>{t("eyebrow")}</Label>
            <h2 className="font-display text-heading font-bold tracking-tight text-fg">
              {t("title")}
            </h2>
            <p className="font-body text-sm text-fg-3 max-w-lg">{t("subtitle")}</p>
          </div>

          <When condition={findError !== null}>
            <ErrorNotice
              title={t("error")}
              message={findError ?? ""}
              onRetry={handleSearch}
              onDismiss={dismissError}
            />
          </When>

          <When condition={installError !== null}>
            <ErrorNotice
              title={t("installError")}
              message={installError ?? ""}
              onDismiss={dismissInstallError}
            />
          </When>
        </motion.section>

        <motion.section
          {...fadeUp(0.05)}
          className="flex shrink-0 flex-wrap items-end gap-3 border-b border-border pb-4"
        >
          <Input
            ref={inputRef}
            label={t("query")}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("queryPlaceholder")}
            wrapperClassName="min-w-64 flex-1"
          />
          <Input
            label={t("owner")}
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("ownerPlaceholder")}
            spellCheck={false}
            wrapperClassName="w-full sm:w-48 shrink-0"
          />

          <When condition={qLen > 0 || owner.length > 0}>
            <Button size="sm" variant="ghost" className="h-10" onClick={handleClear}>
              <X size={12} />
              {t("clear")}
            </Button>
          </When>

          <span
            aria-live="polite"
            className="ml-auto flex h-10 items-center border-l border-border pl-4 font-mono uppercase tracking-label text-micro text-fg-4"
          >
            {statusLabel}
          </span>
        </motion.section>

        <section className="flex min-h-0 flex-1 flex-col">
          <ResultsPanel
            showHint={showHint}
            loading={findLoading}
            empty={showEmpty}
            results={findResults}
            installedPackages={installedPackages}
            installingPackage={installingPackage}
            installBusy={installBusy}
            onInstall={handleInstall}
            onGoExplore={handleGoExplore}
          />
        </section>
      </div>
    </main>
  );
}
