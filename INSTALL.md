# Installing Curie

This guide covers **downloading a built app** and **building from source**. For product overview, see [README.md](./README.md).

---

## Option A — Homebrew (macOS Apple Silicon)

```bash
brew install --cask sthbryan/tap/curie
```

Upgrade later:

```bash
brew update && brew upgrade --cask curie
```

The cask lives in the [sthbryan/homebrew-tap](https://github.com/sthbryan/homebrew-tap) repo. **Every Curie release needs a matching bump there** (`version` + `sha256` of the new DMG); until that lands, `brew upgrade` will not see the new build.

## Option B — One-line install script

```bash
curl -fsSL https://raw.githubusercontent.com/sthbryan/curie/main/install.sh | bash
```

The script detects your OS/arch, downloads the matching asset from [GitHub Releases](https://github.com/sthbryan/curie/releases), and installs it:

| Platform | Asset | Install location |
|----------|--------|------------------|
| macOS Apple Silicon | `.dmg` | `/Applications/Curie.app` |
| Linux (Debian/Ubuntu) | `.deb` | system package (`dpkg` / `apt`) |
| Linux (other) | `.AppImage` | `~/.local/bin/curie` |

Optional env vars:

```bash
# pin a version
curl -fsSL https://raw.githubusercontent.com/sthbryan/curie/main/install.sh | CURIE_VERSION=0.1.0 bash

# force AppImage on Debian/Ubuntu
curl -fsSL https://raw.githubusercontent.com/sthbryan/curie/main/install.sh | CURIE_FORCE_APPIMAGE=1 bash
```

## Option C — Download a binary manually

1. Open [GitHub Releases](https://github.com/sthbryan/curie/releases).
2. Download the build for your platform:
   - **macOS (Apple Silicon)** — `Curie_*_aarch64.dmg`
   - **Linux x86_64** — `Curie_*_amd64.deb` or `Curie_*_amd64.AppImage`
   - **Windows** — not published yet
3. Install / open as usual for your OS.

### macOS — quarantine (Gatekeeper)

`install.sh` already runs this after copying the app into `/Applications`:

```bash
xattr -dr com.apple.quarantine /Applications/Curie.app
```

(`-d` deletes the attribute; `-r` is recursive so it covers the whole `.app` bundle.)

If you installed manually and macOS says the app is damaged / can’t be opened, clear quarantine yourself:

```bash
# whole app bundle (recommended)
xattr -dr com.apple.quarantine /Applications/Curie.app

# or only the binary inside the bundle
xattr -d com.apple.quarantine /Applications/Curie.app/Contents/MacOS/curie
```

You can also allow it once via **System Settings → Privacy & Security**, or right-click → **Open**.

> Releases may be sparse early on. If nothing is published yet, use **Option D**.

---

## Option D — Build from source

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
