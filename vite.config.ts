import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as {
  version: string;
};

export default defineConfig(async () => ({
  plugins: [preact(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      react: "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
      "react-dom/client": "preact/compat/client",
      "react/jsx-runtime": "preact/jsx-runtime",
      "use-sync-external-store/shim/index.js": fileURLToPath(
        new URL("./src/test/shims/use-sync-external-store.js", import.meta.url),
      ),
    },
  },
  define: {
    __APP_NAME__: JSON.stringify("Curie"),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    alias: {
      react: "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
      "react-dom/client": "preact/compat/client",
      "react/jsx-runtime": "preact/jsx-runtime",
      "use-sync-external-store/shim/index.js": fileURLToPath(
        new URL("./src/test/shims/use-sync-external-store.js", import.meta.url),
      ),
    },
    server: {
      deps: {
        inline: [/^(?!.*\.tsx?$).*$/],
      },
    },
    deps: {
      optimizer: {
        web: {
          include: ["wouter", "zustand", "motion", "react-if", "lucide-react"],
        },
        ssr: {
          include: ["wouter", "zustand", "motion", "react-if", "lucide-react"],
        },
      },
    },
    pool: "threads",
    maxWorkers: '100%',
    minWorkers: 1,
  },
}));
