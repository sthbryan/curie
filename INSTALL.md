# Installing Curie

This guide covers **downloading a built app** and **building from source**. For product overview, see [README.md](./README.md).

---

## Option A — Download a binary

1. Open [GitHub Releases](https://github.com/sthbryan/curie/releases).
2. Download the build for your platform:
   - **macOS** — `.dmg` or `.app`
   - **Windows** — `.msi` or `.exe`
   - **Linux** — `.AppImage` (or distro package when published)
3. Install / open as usual for your OS.
4. On macOS, if Gatekeeper blocks the app: **System Settings → Privacy & Security** and allow Curie, or right-click → Open the first time.

For macOS Apple Silicon, you may need to remove the quarantine attribute:

```bash
xattr -d com.apple.quarantine /usr/local/bin/ftm
```


> Releases may be sparse early on. If nothing is published yet, use **Option B**.

---

## Option B — Build from source

### Prerequisites

| Requirement | Notes |
|-------------|--------|
| [Bun](https://bun.sh) or Node 22+ | Bun is what this repo uses day to day |
| [Rust](https://rustup.rs) | Stable toolchain via `rustup` |
| Tauri system deps | [Platform prerequisites](https://v2.tauri.app/start/prerequisites/) |
| macOS | Xcode Command Line Tools (`xcode-select --install`) |

### Clone

```bash
git clone https://github.com/sthbryan/curie.git
cd curie
```

### Install dependencies

```bash
bun install
```

With npm:

```bash
npm install
```

### Run in development

Desktop app (recommended):

```bash
bun run tauri dev
# or: npm run tauri dev
```

Frontend only (no native window shell):

```bash
bun run dev
```

### Production build

```bash
bun run tauri build
```

Artifacts are written under:

```text
src-tauri/target/release/bundle/
```

Typical outputs:

| Platform | Paths |
|----------|--------|
| macOS | `bundle/dmg/`, `bundle/macos/` |
| Windows | `bundle/msi/`, `bundle/nsis/` |
| Linux | `bundle/appimage/`, `bundle/deb/` (if enabled) |

---

## Verify the environment

After Curie opens, it should detect Node (or offer setup). Global skills are loaded via:

```bash
npx skills list -g --json
```

If the list is empty, install skills with the official CLI first, then hit **Refresh** in Curie (Skills tab).

---

## Developer commands (contributors)

| Command | Purpose |
|---------|---------|
| `bun test` | Unit tests |
| `bun run check` | Biome lint / format check |
| `bun run check:fix` | Auto-fix with Biome |
| `bun run build` | Typecheck + Vite web build only |
| `bun release` | Interactive version bump helper (maintainers) |

Release helper examples:

```bash
bun release              # ask patch / minor / major
bun release minor
bun release 1.2.0
bun release --dry-run
```

---

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| `tauri` / Rust compile errors | Update Rust (`rustup update`), reinstall platform webview deps |
| Node not detected in-app | Install Node or Volta; restart Curie after install |
| Empty skills list | Confirm `npx skills list -g` works in a normal terminal |
| macOS “damaged / can’t be opened” | Prefer a signed release when available; otherwise allow via Privacy & Security |
| Port 1420 in use | Stop other Vite/Tauri dev processes and retry |
|------------------|---------------------------------------------|

---

## Support

- Issues: [github.com/sthbryan/curie/issues](https://github.com/sthbryan/curie/issues)
- Skills ecosystem: [skills.sh](https://skills.sh)
