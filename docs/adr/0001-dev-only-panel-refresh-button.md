# ADR-0001 — Dev-only panel refresh button

**Status:** Accepted
**Date:** 2026-09-12

## Context

Editing plugin code requires restarting Illustrator to see changes. Investigation established: JSX is already hot (`$.evalFile` re-reads `Measurement.jsx` from disk on every bridge dispatch), and CEP panels are persistent in Illustrator (close/reopen does not refresh). Only the panel document (`index.html`, `css/style.css`, `js/main.js`, `KALKULATOR.html` iframe) goes stale. Community-standard fix: reload the panel document in place.

## Decision

Add a dev-only refresh button — small reload icon (↻) inline at the left of the existing footer (`Dev by Khamid & Zaki`), tooltip "Reload panel (dev)". On click: persist current settings, then `window.location.reload()`.

- **Scope:** full panel reload (`A`); no per-file reload mechanics.
- **Visibility:** dev-only (`B`) — hidden in release builds.
- **Dev gating:** file marker `dev.mode` in the extension directory (`A`); no code change needed at release time, just omit the file when packaging.
- **Placement:** inline in the existing footer, no extra panel height (`A`).
- **Pre-reload behavior:** reuse `saveSettings()` before reloading (`A`) so un-measured setting edits are not lost; active tab resets to MEAS after reload (tab state is not persisted; deliberately out of scope).
- **No keyboard shortcut** (`A`).

## Consequences

- Development loop becomes: edit file → click refresh → see result. No Illustrator restart for code edits.
- Release builds show no button; forgetting to omit `dev.mode` leaks a harmless reload button (no data loss risk — settings persist on reload).
- `manifest.xml` changes still require a restart (out of scope; cannot be solved from inside the panel).

## Links

- Domain terms: "panel refresh", "dev marker", "hot JSX", "panel persistency" — see `CONTEXT.md`.
- Implementation ticket (when created): `.scratch/<feature>/…`.