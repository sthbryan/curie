import type { LucideIcon } from "lucide-react";
import {
  Compass,
  FileCode,
  House,
  LayoutGrid,
  Search,
  Settings as SettingsIcon,
} from "lucide-react";
import { motion, useReducedMotionConfig } from "motion/react";
import type { FocusEvent } from "react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { duration, easeOut } from "@/lib/motion";
import { reducedTransition } from "@/lib/transition";
import { NavItem } from "./NavItem";

type NavKey = "home" | "skills" | "explore" | "find" | "custom";

const TOP_ITEMS: { path: string; key: NavKey; num: string; icon: LucideIcon }[] = [
  { path: "/", key: "home", num: "01", icon: House },
  { path: "/installed", key: "skills", num: "02", icon: LayoutGrid },
  { path: "/marketplace", key: "explore", num: "03", icon: Compass },
  { path: "/find", key: "find", num: "04", icon: Search },
  { path: "/custom", key: "custom", num: "05", icon: FileCode },
];

export const RAIL_WIDTH = 50;
const PANEL_WIDTH = 172;

export function Sidebar() {
  const t = useT();
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const shouldReduceMotion = useReducedMotionConfig();

  const handleNavSettings = () => navigate("/settings");

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setOpen(false);
  };

  return (
    <div className="relative z-30 shrink-0" style={{ width: RAIL_WIDTH }}>
      <motion.nav
        initial={false}
        animate={{ width: open ? PANEL_WIDTH : RAIL_WIDTH }}
        transition={reducedTransition({
          shouldReduceMotion,
          transition: { duration: duration.base, ease: easeOut },
        })}
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        className={cn(
          "absolute inset-y-0 left-0 flex flex-col overflow-hidden border-r border-border bg-surface",
          open && "shadow-2xl",
        )}
      >
        <div className="flex flex-col gap-0.5 px-2 pt-4 pb-2">
          {TOP_ITEMS.map((item) => {
            const handleNavItem = () => {
              navigate(item.path);
            };
            return (
              <NavItem
                key={item.path}
                number={item.num}
                label={t(`nav.${item.key}`)}
                icon={item.icon}
                active={location === item.path}
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
            active={location === "/settings"}
            expanded={open}
            onClick={handleNavSettings}
          />
        </div>
      </motion.nav>
    </div>
  );
}
