import { Check, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster as SonnerToaster } from "sonner";

const ICON_SIZE = 13;

const baseToast =
  "absolute inset-x-0 mx-auto flex w-fit max-w-full items-start gap-2.5 border border-border-strong border-l-2 bg-surface-hover py-3 pl-3 pr-9 font-mono text-micro shadow-lg";
const baseIcon = "relative flex h-4.5 w-4 shrink-0 items-center justify-center";
const baseTitle = "flex min-w-0 items-center gap-2 text-fg uppercase tracking-label";
const baseDescription = "mt-1 normal-case tracking-normal text-fg-3";
const baseCloseButton =
  "absolute top-3 right-2 inline-flex h-5 w-5 cursor-pointer items-center justify-center text-fg-3 transition-colors hover:text-fg";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      gap={8}
      offset={24}
      style={{ "--width": "520px" } as CSSProperties}
      closeButton
      icons={{
        loading: <LoaderCircle size={ICON_SIZE} className="animate-spin text-fg-3" aria-hidden />,
        success: <Check size={ICON_SIZE} className="text-success" aria-hidden />,
        error: <X size={ICON_SIZE} className="text-error" aria-hidden />,
        warning: <TriangleAlert size={ICON_SIZE} className="text-warning" aria-hidden />,
        info: <Info size={ICON_SIZE} className="text-info" aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: baseToast,
          icon: baseIcon,
          content: "flex min-w-0 flex-1 flex-col gap-1",
          title: baseTitle,
          description: baseDescription,
          closeButton: baseCloseButton,
          loading: "border-l-fg-4",
          success: "border-l-success",
          error: "border-l-error",
          warning: "border-l-warning",
          info: "border-l-info",
        },
      }}
    />
  );
}
