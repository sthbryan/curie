import { useLocation } from "wouter";
import { t } from "../i18n";
import { useAppStore } from "../store/app";
import { Button } from "./Button";
import type { View } from "./types";

type Props = {
  view: Exclude<View, "home" | "installed" | "search" | "settings">;
};

export function Placeholder({ view }: Props) {
  const lang = useAppStore((s) => s.lang);
  const [, navigate] = useLocation();

  return (
    <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 px-10">
      <span className="font-display text-heading font-bold tracking-tight text-fg">
        {view.toUpperCase()}
      </span>
      <span className="font-mono uppercase tracking-label text-mono text-fg-3">
        {t(lang, "home.notBuilt")}
      </span>
      <Button size="md" variant="outline" className="mt-4" onClick={() => navigate("/")}>
        {t(lang, "home.back")}
      </Button>
    </main>
  );
}
