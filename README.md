# curie

Native desktop manager for [agent skills](https://skills.sh) (`npx skills`). Detects Node, manages global skills, browse/find/install/remove.

## Stack

- Tauri 2 (cross-platform desktop, Rust shell)
- React + Vite + TypeScript
- Tailwind v4 with design tokens (dark + light themes)
- Backend wraps `npx skills` CLI via Tauri commands

## Development

Prerequisites: Node 22+, Rust, Xcode CLT (macOS), platform webview deps.

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

Outputs `.dmg` (macOS), `.msi` (Windows), `.AppImage` (Linux) in `src-tauri/target/release/bundle/`.

## License

MIT
