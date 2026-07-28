<!--
  Keep it short. The diff shows what changed — this says why, and how to trust it.
  Delete any section that does not apply.
-->

## What changed

<!-- One or two lines. Plain language, not a commit list. -->

## Why

<!-- The problem this solves. Link the issue: Closes #123 -->

## How to verify

<!-- The steps a reviewer runs to see it work. Name the screen, not just the file. -->

1.
2.

## Screenshots (if applicable)

<!--
  UI changes: drag images or a short clip straight into the table.
  One row per screen. Delete this section if nothing visual changed.
-->

## Checks

- [ ] `bun run check`
- [ ] `bun run test`
- [ ] `cargo test --manifest-path src-tauri/Cargo.toml` <!-- only if src-tauri changed -->
- [ ] Tried it in the running app

## Notes

<!--
  Anything a reviewer would otherwise have to discover: a tradeoff you took,
  something you left out on purpose, a part you could not verify yourself.
-->
