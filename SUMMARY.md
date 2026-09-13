# TSP Sign Tools — Project Summary

> Written 2026-08-28 during repo exploration. See `INSTALL-WINDOWS.bat`, `CSXS/manifest.xml`, and the per-file references below for details.

## What it is

An **Adobe Illustrator CEP extension** (panel, ~700×420px) for signage production: it auto-draws architectural dimension measurements around selected objects, rescales artwork to architectural drawing scales, and bundles a signage calculator. Developed by "Khamid & Zaki" (signature in panel footer). No README, no git history, no build script — packaging is manual (ZXPSignCmd sign → .bat install). One framework-free self-check: `test/dev-refresh.test.js` (`node test/dev-refresh.test.js`).

## Repository layout

```
TSP-Sign-Tools/                       ← repo root: TSP-Sign-Tools/
├── TSP-Sign-Tools/                   ← SYMLINK → C:\Users\zaky\AppData\Roaming\Adobe\CEP\extensions\TSP Signtools
│   ├── CSXS/manifest.xml             CEP 7.0 manifest, CSXS 12.0, host ILST [29.0, 99.9]
│   ├── index.html                    panel shell, 3 tabs: MEAS / SCALE / CALC (+ inline CSS)
│   ├── js/main.js      (845 lines)   panel UI logic, settings persistence, CEP bridge
│   ├── js/CSInterface.js             stock minified Adobe CSXS bridge (6.6 KB)
│   ├── jsx/Measurement.jsx (1040)    ExtendScript: drawing, scaling, formatting in Illustrator
│   ├── KALKULATOR.html (391 lines)   calculator, embedded via iframe in CALC tab
│   └── css/style.css                 warm cream/navy/green theme (duplicate of inline styles)
├── INSTALL-WINDOWS.bat               installer: pushes TSP-Sign-Tools.zxp via Adobe UnifiedPluginInstallerAgent
├── ZXPSignCmd.exe                    Adobe ZXP code-signing CLI
└── tsp-cert-v2.p12                   code-signing certificate (password-protected; password NOT in repo)
```

Sibling: `TSP-Sign-Tools.before-symlink-20260828-182228/` — identical backup taken before the extension folder was replaced by a symlink.

## How it works

**Architecture / bridge**
- `main.js` builds a script string: `$.evalFile("<extPath>/jsx/Measurement.jsx"); runMeasurement(<JSON>);` and dispatches via `window.__cs.evalScript(...)` (`CSInterface`, injected by `js/CSInterface.js`; falls back to `__cs = null` with silent no-op if unavailable).
- Panel settings persist in `localStorage` key `tspSignDimSettings` (side toggles, offset, appearance, scale index, line style, number format, unit, metric unit, text style, arrow mode), restored on load.
- `KALKULATOR.html` talks back via `parent.detectObjectInIllustrator(callback)` — an inline evalScript that measures the selection bounds.

**MEAS tab** — `drawMeasurement()` draws on all 4 sides around the selection, into a `__tsp_safe__` layer (created if the active layer is locked): extension lines + either arrow (broken center for label), dashed tick marks, or slanted architectural ticks; centered dimension labels (default dual: `10'-2½"` over `(2'-6")`). Options:
- Line style: arrow / tick / slanted (slanted uses Gotham-Medium; others ArialMT)
- Output unit cycle: FEET → INCH → METRIC (mm/cm/m)
- Number format: fraction (precision 1/2…1/64) or decimal (2/3 places)
- Text style: linear vs SYMBOL (custom stacked fractions via superscript/subscript baseline styling, 3 fallback methods)
- Architectural scale via `getScaleFactor()` (1/16"=1'→192 … 6"=1'→2, default Full Size=1) or custom percentage override
- Offset distance (extension line gap) and "Appearance" slider (scales stroke weight 2%–100% of base 0.9pt)

**SCALE tab** — `scaleObject(scaleText, mode, customPercent)`:
- divide mode = `100/factor` (e.g. 1/4"=1' → 4.167%), multiply/restore = `100*factor`
- custom % overrides dropdown; multi-selection grouped via a temp group so all scale uniformly
- pre-harvests stroke widths and corner radii (`collectStroked`, `collectCorners`) and re-applies them ×ratio after resize ("Illustrator doesn't scale strokes" fix)
- stamps an indicator text (e.g. `SCALE 1/4" : 12"`) at the selection top

**CALC tab** — basic arithmetic, inch↔feet converter (parses `13'-6"`, `3/8`, superscript/subscript/Unicode fractions via `parseFraction`/`parseDim`), square-foot calc with "Detect Object" (fills width/height from the Illustrator selection, formats as `f'-w n/d"`), and "Count Allowed" coverage (area × %).

## Known findings / rough edges

- `main.js` is written in a defensive multi-line style (long-winded but consistent); JSX is Indonesian-commented ("KONDISI 1/2"), mixed English/Indonesian labels.
- CSS duplicated between `index.html` inline `<style>` and `css/style.css` (drift risk; `:root` variables differ in the two copies).
- `KALKULATOR.html` contains a Kaspersky AV-injected `<script src="https://me.kis.v2.scr.kaspersky-labs.com/...">` tag — local artifact, strip before packaging/distribution.
- Heavy blanket `try/catch` everywhere; bounds logic falls back geometric→visible→zero-box.
- CFG is a single flat global in the JSX; `eval('(' + data + ')')` used to parse the JSON payload.
- No README, license, changelog, or build script in repo.

## Getting started / workflow

1. Edit files in `TSP-Sign-Tools/` (symlinked into the CEP extensions dir, so changes are live after reloading the panel). A `dev.mode` marker in that directory enables the dev-only panel-refresh button (↻, footer; ADR-0001) — omit the file when packaging.
2. Build/sign: `ZXPSignCmd.exe -sign <dir> TSP-Sign-Tools.zxp tsp-cert-v2.p12 <cert-password>`
3. Distribute: copy `.zxp` next to `INSTALL-WINDOWS.bat`, run it → panel at Illustrator `Window > Extensions > TSP Sign Tools`.