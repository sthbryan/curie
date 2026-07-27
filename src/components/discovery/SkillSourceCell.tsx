import { openUrl } from "@tauri-apps/plugin-opener";
import { SquareArrowOutUpRight } from "lucide-react";
import { useT } from "@/i18n";
import type { DiscoveryNamespace } from "./types";

type Props = {
  ns: DiscoveryNamespace;
  source: string;
  url: string;
};

export function SkillSourceCell({ ns, source, url }: Props) {
  const t = useT(ns);

  const handleOpen = () => {
    void openUrl(url);
  };

  return (
    <>
      <span className="truncate font-mono text-mono text-fg-2">{source || "—"}</span>
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-fit items-center gap-1 truncate text-left font-mono uppercase tracking-label text-micro text-fg-4 hover:text-fg"
      >
        {t("open")}
        <SquareArrowOutUpRight size={10} />
      </button>
    </>
  );
}
