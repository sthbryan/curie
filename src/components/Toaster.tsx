import { ToastViewport } from "@zovaris/sephiro/toast";

import "@zovaris/sephiro/css/toast.css";

import { useT } from "@/i18n";

export function Toaster() {
  const t = useT("toast");

  return <ToastViewport label={t("notifications")} position="top-center" offset={24} gap={8} />;
}
