import type { Lang } from "../i18n";
import { t } from "../i18n";
import { useUiStore } from "../store/ui";
import { Button } from "./Button";
import type { ErrorBoundaryFallbackProps } from "./ErrorBoundary";

type Props = ErrorBoundaryFallbackProps & {
  /** Keep chrome (sidebar/header) vs full-screen root crash. */
  variant?: "page" | "root";
  onHome?: () => void;
};

function resolveLang(): Lang {
  try {
    return useUiStore.getState().lang;
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
        <Button size="md" variant="primary" onClick={reset}>
          {t(lang, "error.retry")}
        </Button>
        {onHome && (
          <Button
            size="md"
            variant="outline"
            onClick={() => {
              onHome();
              reset();
            }}
          >
            {t(lang, "error.home")}
          </Button>
        )}
        {variant === "root" && (
          <Button size="md" variant="outline" onClick={() => window.location.reload()}>
            {t(lang, "error.reload")}
          </Button>
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
