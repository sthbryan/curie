import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import { lang } from "@/store/system";
import { fileNameOf, pickMarkdown } from "../lib/drop";

type Props = {
  enabled: boolean;
  onFile: (name: string, content: string) => void;
};

export function useFileDrop({ enabled, onFile }: Props): { dragging: boolean } {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    const listen = async () => {
      const webview = getCurrentWebview();
      return webview.onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          setDragging(enabled);
          return;
        }
        if (event.payload.type === "leave") {
          setDragging(false);
          return;
        }

        setDragging(false);
        if (!enabled) return;

        const path = pickMarkdown(event.payload.paths);
        if (!path) {
          toast.error(t(lang.value, "custom.local.dropRejected"));
          return;
        }

        void invoke<string>("read_markdown_file", { path })
          .then((content) => onFile(fileNameOf(path), content))
          .catch((e) => {
            toast.error(t(lang.value, "custom.local.dropFailed"), {
              description: errorMessage(e),
            });
          });
      });
    };

    listen()
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch(() => {
        // no webview to listen on — the upload button still works
      });

    return () => {
      cancelled = true;
      unlisten?.();
      setDragging(false);
    };
  }, [enabled, onFile]);

  return { dragging };
}
