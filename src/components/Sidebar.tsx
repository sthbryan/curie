import type { LucideIcon } from "lucide-react";
import {
  Compass,
  FileCode,
  FolderGit2,
  House,
  LayoutGrid,
  Search,
  Settings as SettingsIcon,
} from "lucide-react";
import type { FocusEvent } from "react";
import { useState } from "react";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/motion";
import type { Section } from "@/lib/routes";
import { useRoute } from "@/lib/routes";
import { NavItem } from "./NavItem";

type NavKey = "home" | "skills" | "explore" | "find" | "custom" | "projects";

const TOP_ITEMS: { section: Section; key: NavKey; num: string; icon: LucideIcon }[] = [
  { section: "home", key: "home", num: "01", icon: House },
  { section: "installed", key: "skills", num: "02", icon: LayoutGrid },
  { section: "marketplace", key: "explore", num: "03", icon: Compass },
  { section: "find", key: "find", num: "04", icon: Search },
  { section: "custom", key: "custom", num: "05", icon: FileCode },
  { section: "projects", key: "projects", num: "06", icon: FolderGit2 },
];

export const RAIL_WIDTH = 50;
const PANEL_WIDTH = 172;

export function Sidebar() {
  const t = useT();
  const { section, go } = useRoute();
  const [open, setOpen] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  const handleNavSettings = () => go("settings", null);

  const handleHoverStart = () => setOpen(true);
  const handleHoverEnd = () => setOpen(false);

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setOpen(false);
  };

  return (
    <div className="relative z-30 shrink-0" style={{ width: RAIL_WIDTH }}>
      <nav
        style={{ width: open ? PANEL_WIDTH : RAIL_WIDTH }}
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
        onFocus={handleHoverStart}
        onBlur={handleBlur}
        className={cn(
          "absolute inset-y-0 left-0 flex flex-col overflow-hidden border-r border-border bg-surface",
          !shouldReduceMotion &&
            "transition-[width] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open && "shadow-2xl",
        )}
      >
        <div className="flex flex-col gap-0.5 px-2 pt-4 pb-2">
          {TOP_ITEMS.map((item) => {
            const handleNavItem = () => {
              go(item.section);
            };
            return (
              <NavItem
                key={item.section}
                number={item.num}
                label={t(`nav.${item.key}`)}
                icon={item.icon}
                active={section === item.section}
                expanded={open}
                onClick={handleNavItem}
              />
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="border-t border-border px-2 py-3">
          <NavItem
            number="00"
            label={t("nav.settings")}
            icon={SettingsIcon}
            active={section === "settings"}
            expanded={open}
            onClick={handleNavSettings}
          />
        </div>
      </nav>
    </div>
  );
}
