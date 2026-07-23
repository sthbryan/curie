// Re-export preact/compat's useSyncExternalStore so that
// `use-sync-external-store/shim/index.js` (CJS, used transitively by
// wouter) can resolve `React.useSyncExternalStore` against preact's
// implementation instead of crashing on the real react's internals.
//
// This file is referenced from `vite.config.ts` via `resolve.alias`
// (and `test.alias`) under the key `use-sync-external-store/shim/index.js`.
export { useSyncExternalStore } from "preact/compat";
