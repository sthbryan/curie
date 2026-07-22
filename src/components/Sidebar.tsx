import type { Lang } from "../i18n";
import { t } from "../i18n";
import { NavItem } from "./NavItem";
import type { View } from "./types";

type Props = {
  lang: Lang;
  view: View;
  setView: (view: View) => void;
};

const TOP_ITEMS: { id: View; key: "home" | "skills" | "explore" | "find"; num: string }[] = [
  { id: "home", key: "home", num: "01" },
  { id: "installed", key: "skills", num: "02" },
  { id: "marketplace", key: "explore", num: "03" },
  { id: "search", key: "find", num: "04" },
];

export function Sidebar({ lang, view, setView }: Props) {
  return (
    <nav className="flex w-28 shrink-0 flex-col border-r border-border">
      <div className="flex flex-col py-5">
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

      <hr className="border-border" />

      <div className="flex flex-col py-5">
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
