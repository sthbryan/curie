import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-left"
      gap={8}
      offset={16}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-start gap-3 border border-border bg-surface px-4 py-3 font-mono text-mono text-fg shadow-lg",
          icon: "mt-0.5 shrink-0",
          title: "text-fg",
          description: "text-fg-3",
        },
      }}
    />
  );
}
