import { Sidebar as UiSidebar } from "@zovaris/sephiro/sidebar";
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

import "@zovaris/sephiro/css/sidebar.css";

import { useT } from "@/i18n";
import type { Section } from "@/lib/routes";
import { useRoute } from "@/lib/routes";

type NavKey = "home" | "skills" | "explore" | "find" | "custom" | "projects";

const TOP_ITEMS: { section: Section; key: NavKey; num: string; icon: LucideIcon }[] = [
  { section: "home", key: "home", num: "01", icon: House },
  { section: "installed", key: "skills", num: "02", icon: LayoutGrid },
  { section: "marketplace", key: "explore", num: "03", icon: Compass },
  { section: "find", key: "find", num: "04", icon: Search },
  { section: "custom", key: "custom", num: "05", icon: FileCode },
  { section: "projects", key: "projects", num: "06", icon: FolderGit2 },
];

const RAIL_WIDTH = 56;

export function Sidebar() {
  const t = useT();
  const { section, go } = useRoute();

  const label = (num: string, text: string) => (
    <span className="flex items-baseline gap-2 font-mono uppercase tracking-label text-micro">
      <span className="text-fg-4">{num}</span>
      <span>{text}</span>
    </span>
  );

  const icon = (Icon: LucideIcon) => <Icon size={16} strokeWidth={1.5} />;

  return (
    <div className="relative z-30 shrink-0" style={{ width: RAIL_WIDTH }}>
      <UiSidebar
        ariaLabel={t("nav.primary")}
        className="absolute inset-y-0 left-0 shadow-2xl"
        collapsedMode="hover"
        value={section}
        onSelect={(value) => go(value as Section)}
        sections={[
          {
            items: TOP_ITEMS.map((item) => ({
              value: item.section,
              icon: icon(item.icon),
              label: label(item.num, t(`nav.${item.key}`)),
            })),
          },
          {
            items: [
              {
                value: "settings",
                icon: icon(SettingsIcon),
                label: label("00", t("nav.settings")),
              },
            ],
          },
        ]}
      />
    </div>
  );
}
