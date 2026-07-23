import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      gap={8}
      offset={24}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-start gap-3 w-full max-w-sm border-l-2 border-l-accent border border-border-strong bg-surface-hover px-4 py-3 font-mono text-mono",
          icon: "hidden",
          title: "text-fg uppercase tracking-label",
          description: "text-fg-3",
        },
      }}
    />
  );
}
