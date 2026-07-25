import { Toaster as SonnerToaster } from "sonner";

const baseToast =
  "flex items-start gap-3 w-full max-w-sm border-l-4 border-0 border border-border-strong bg-surface-hover pl-3 pr-9 py-3 font-mono text-mono shadow-lg";
const baseTitle = "text-fg uppercase tracking-label flex min-w-0 items-center gap-2";
const baseDescription = "text-fg-3 mt-1 normal-case tracking-normal";
const baseCloseButton =
  "absolute top-3 right-2 inline-flex h-5 w-5 items-center justify-center text-fg-3 hover:text-fg transition-colors cursor-pointer";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      gap={8}
      offset={24}
      closeButton
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: baseToast,
          icon: "hidden",
          content: "flex flex-col gap-1 min-w-0 flex-1",
          title: baseTitle,
          description: baseDescription,
          closeButton: baseCloseButton,
          loading: "border-info",
          success: "border-success",
          error: "border-error",
          warning: "border-warning",
          info: "border-info",
        },
      }}
    />
  );
}
