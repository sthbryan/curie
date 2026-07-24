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
import { useState } from "react";
import { useLocation } from "wouter";
import { useT } from "@/i18n";
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

const COLLAPSED_W = 50;
const EXPANDED_W = 160;

export function Sidebar() {
  const t = useT();
  const [location, navigate] = useLocation();
  const [hovered, setHovered] = useState(false);

  const shouldReduceMotion = useReducedMotionConfig();

  const handleNavSettings = () => navigate("/settings");

  return (
    <motion.nav
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ width: hovered ? EXPANDED_W : COLLAPSED_W }}
      transition={reducedTransition({
        shouldReduceMotion,
        transition: { duration: duration.slow, ease: easeOut },
      })}
      className="flex shrink-0 flex-col border-r border-border bg-surface"
    >
      <div className="flex flex-col gap-0.5 px-2 pt-4 pb-2">
        {TOP_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            number={item.num}
            label={t(`nav.${item.key}`)}
            icon={item.icon}
            active={location === item.path}
            expanded={hovered}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>

      <div className="flex-1" />

      <div className="border-t border-border px-2 py-3">
        <NavItem
          number="00"
          label={t("nav.settings")}
          icon={SettingsIcon}
          active={location === "/settings"}
          expanded={hovered}
          onClick={handleNavSettings}
        />
      </div>
    </motion.nav>
  );
}
