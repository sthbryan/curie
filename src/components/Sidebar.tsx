import { t } from "../i18n";
import { useAppStore } from "../store/app";
import { NavItem } from "./NavItem";
import type { View } from "./types";

const TOP_ITEMS: { id: View; key: "home" | "skills" | "explore" | "find"; num: string }[] = [
  { id: "home", key: "home", num: "01" },
  { id: "installed", key: "skills", num: "02" },
  { id: "marketplace", key: "explore", num: "03" },
  { id: "search", key: "find", num: "04" },
];

export function Sidebar() {
  const lang = useAppStore((s) => s.lang);
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  return (
    <nav className="flex w-29 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex flex-col gap-0.5 px-2 pt-4 pb-2">
        {TOP_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            number={item.num}
            label={t(lang, `nav.${item.key}`)}
            active={view === item.id}
            onClick={() => setView(item.id)}
          />
        ))}
      </div>

      <div className="flex-1" />

      <div className="border-t border-border px-2 py-3">
        <NavItem
          number="00"
          label={t(lang, "nav.settings")}
          active={view === "settings"}
          onClick={() => setView("settings")}
        />
      </div>
    </nav>
  );
}
