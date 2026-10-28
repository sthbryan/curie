# Preview harness

Runs the real app shell in a plain browser, with the Tauri bridge replaced by
stubs that answer from [`fixtures.ts`](./fixtures.ts). It exists so screens can
be opened, inspected and measured without compiling the Rust side.

```sh
bun run preview:ui        # http://localhost:1433
```

Pick the screen with `?path=`:

| URL | Screen |
| --- | --- |
| `/tools/preview/index.html` | Installed (default) |
| `?path=/` | Home |
| `?path=/marketplace` | Explore |
| `?path=/find` | Find |
| `?path=/custom` | Custom |
| `?path=/projects` | Projects |
| `?path=/settings` | Settings |

Setup is a stage rather than a route, so it has its own flags:

- `?setup=1` — boots as a machine without Node, so the setup screen renders.
- `?setup=1&hang=1` — same screen, but `install_node` never resolves, which
  keeps the running step list on screen.

## What it is not

- **Not a test harness.** The suite runs on happy-dom; this renders the real
  browser layout, which is what you want for spacing, wrapping and overflow.
  Both are useful, for different questions.
- **Not a mock of the UI.** It mounts `@/App` itself: routing, signals, boot and
  every component are the app's. Only the `@tauri-apps/*` modules are swapped.
- **Not the Tauri window.** Anything native — the installer, the updater, file
  dialogs, drag & drop, actual skill files — is a stub. The fixtures are the
  data; edit them to reproduce a state.

## Measuring instead of eyeballing

The harness is most useful through `preview_evaluate`-style checks. A quick
audit that catches the usual regressions:

```js
[...document.querySelectorAll("body *")]
  .filter((el) => getComputedStyle(el).borderTopLeftRadius !== "0px")
  .map((el) => [el.className, getComputedStyle(el).borderTopLeftRadius]);
```

Clip detection, which is what breaks first when a font or a spacing token
changes:

```js
[...document.querySelectorAll("body *")]
  .filter((el) => {
    const cs = getComputedStyle(el);
    const clipped = cs.overflowX === "hidden" && el.scrollWidth > el.clientWidth + 1;
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    return clipped && text;
  })
  .map((el) => [el.className, el.textContent.trim().slice(0, 40)]);
```

Compare element rectangles before and after a CSS change by taking a snapshot
of every `getBoundingClientRect()` plus `scrollWidth`/`scrollHeight`, toggling
the property in `document.documentElement.style`, and diffing the two arrays.
