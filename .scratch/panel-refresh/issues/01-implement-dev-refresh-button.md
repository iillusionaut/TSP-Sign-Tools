# 01 — Implement dev-only panel refresh button

Type: task
Status: resolved

Implements ADR-0001 (`docs/adr/0001-dev-only-panel-refresh-button.md`).

## Answer

- `TSP-Sign-Tools/index.html` — footer relaxed to take an absolutely-positioned
  inline button `#btnRefreshPanel` (↻, `title="Reload panel (dev)"`), default
  `display:none` via `.panel-refresh` (inline `<style>` + `css/style.css`, per
  repo's duplicated-rules convention).
- `TSP-Sign-Tools/js/main.js` — Measure payload extracted into
  `saveSettings()` (returns `data`; Measure now consumes it, no behavior
  change). New dev block: if `btnRefreshPanel` exists and `window.__cs` is
  live, run JSX `String(new File("<ext>/dev.mode").exists)`; on `"true"`, show
  the button and bind click = `saveSettings()` then `window.location.reload()`.
- `TSP-Sign-Tools/dev.mode` — dev marker present in the symlinked dev copy;
  packaging omits it.
- `test/dev-refresh.test.js` — framework-free node self-check: marker
  absent → hidden/no handler; marker present → shown, click persists
  un-measured edits to `tspSignDimSettings` and reloads once; no CEP host →
  no evalScript. Run: `node test/dev-refresh.test.js`.

## Comments

- No git repo in this project; "/code-review" (diff-based) cannot pin a fixed
  point. Review was done manually against the ADR checklist plus the
  standards-smell list: all `A` items satisfied, no duplicated save payload
  (extracted), no speculative generality.