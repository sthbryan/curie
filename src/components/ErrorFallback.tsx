import type { Lang } from "../i18n";
import { t } from "../i18n";
import { useAppStore } from "../store/app";
import type { ErrorBoundaryFallbackProps } from "./ErrorBoundary";

type Props = ErrorBoundaryFallbackProps & {
  /** Keep chrome (sidebar/header) vs full-screen root crash. */
  variant?: "page" | "root";
  onHome?: () => void;
};

function resolveLang(): Lang {
  try {
    return useAppStore.getState().lang;
  } catch {
    const raw = document.documentElement.lang || navigator.language || "en";
    return raw.toLowerCase().startsWith("es") ? "es" : "en";
  }
}

export function ErrorFallback({ error, reset, variant = "page", onHome }: Props) {
  const lang = resolveLang();
  const message = error.message?.trim() || t(lang, "error.unknown");

  const body = (
    <div className="flex max-w-md flex-col items-center gap-4 text-center">
      <span className="font-mono uppercase tracking-label text-micro text-accent">
        {t(lang, "error.eyebrow")}
      </span>
      <h2 className="font-display text-heading font-bold tracking-tight text-fg">
        {t(lang, "error.title")}
      </h2>
      <p className="font-body text-sm text-fg-3">{t(lang, "error.subtitle")}</p>
      <p
        className="w-full border border-border-strong bg-surface-tint px-3 py-2 font-mono text-micro text-fg-3 break-all text-left"
        title={message}
      >
        {message}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="h-9 px-4 bg-fg text-bg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:opacity-90 transition-opacity duration-150"
        >
          {t(lang, "error.retry")}
        </button>
        {onHome && (
          <button
            type="button"
            onClick={() => {
              onHome();
              reset();
            }}
            className="h-9 px-4 border border-border-strong text-fg-2 rounded-sm font-mono uppercase tracking-label text-mono hover:border-fg-3 hover:text-fg transition-colors duration-150"
          >
            {t(lang, "error.home")}
          </button>
        )}
        {variant === "root" && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-9 px-4 border border-border-strong text-fg-2 rounded-sm font-mono uppercase tracking-label text-mono hover:border-fg-3 hover:text-fg transition-colors duration-150"
          >
            {t(lang, "error.reload")}
          </button>
        )}
      </div>
    </div>
  );

  if (variant === "root") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-bg px-10 text-fg">
        {body}
      </div>
    );
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 px-10">
      {body}
    </main>
  );
}
