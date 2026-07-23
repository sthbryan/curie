import { useLocation } from "wouter";
import { t } from "@/i18n";
import { useUiStore } from "@/store/ui";
import { NavItem } from "./NavItem";

type NavKey = "home" | "skills" | "explore" | "find";

const TOP_ITEMS: { path: string; key: NavKey; num: string }[] = [
  { path: "/", key: "home", num: "01" },
  { path: "/installed", key: "skills", num: "02" },
  { path: "/marketplace", key: "explore", num: "03" },
  { path: "/find", key: "find", num: "04" },
];

export function Sidebar() {
  const lang = useUiStore((s) => s.lang);
  const [location, navigate] = useLocation();

  return (
    <nav className="flex w-29 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex flex-col gap-0.5 px-2 pt-4 pb-2">
        {TOP_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            number={item.num}
            label={t(lang, `nav.${item.key}`)}
            active={location === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>

      <div className="flex-1" />

      <div className="border-t border-border px-2 py-3">
        <NavItem
          number="00"
          label={t(lang, "nav.settings")}
          active={location === "/settings"}
          onClick={() => navigate("/settings")}
        />
      </div>
    </nav>
  );
}
