import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";

import base from "../../vite.config";

const stub = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// The only difference from the app config: the Tauri bindings point at local
// stubs, so the shell renders in a plain browser.
const TAURI_STUBS = {
  "@tauri-apps/api/core": stub("./tauri/core.ts"),
  "@tauri-apps/api/event": stub("./tauri/event.ts"),
  "@tauri-apps/api/webview": stub("./tauri/webview.ts"),
  "@tauri-apps/plugin-opener": stub("./tauri/opener.ts"),
  "@tauri-apps/plugin-dialog": stub("./tauri/dialog.ts"),
};

export default defineConfig(async (env) => {
  const config = typeof base === "function" ? await base(env) : base;
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: { ...TAURI_STUBS, ...(config.resolve?.alias as Record<string, string>) },
    },
    server: { ...config.server, port: 1433, strictPort: true },
  };
});
