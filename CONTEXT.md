# CONTEXT.md — TSP Sign Tools

Glossary and domain notes for this project. Created lazily; extended when terms or decisions crystallise.

## Domain glossary

### Panel (UI)

- **Panel** — the CEP extension window (HTML document `index.html` + `js/main.js` + `css/style.css`). Reloading the panel re-reads these three from disk.
- **Panel refresh** — reloading the panel document (`window.location.reload()`) so HTML/CSS/JS edits take effect without restarting Illustrator. Does NOT reload or re-parse `Measurement.jsx`; that is covered by **hot JSX** below.
- **Settings** — the persisted panel configuration stored under `localStorage` key `tspSignDimSettings` (side toggles, offset, appearance, scale, line style, number format, unit, metric unit, text style, arrow text mode, custom measure percent). Written only when the Measure button runs `saveSettings()`.
- **Dev-only UI** — panel controls (e.g. the refresh button) that are hidden in release builds, gated by the **dev marker**.

### Dev workflow

- **Dev marker** — a file named `dev.mode` in the extension directory. If present, the panel is considered a development build and dev-only UI is shown. Release packaging simply omits the file; no code edits needed at release time.
- **Hot JSX** — property of the bridge: `$.evalFile()` re-reads `Measurement.jsx` from disk on every dispatch, so ExtendScript changes are live immediately; only the panel document goes stale.
- **Panel persistency** — Illustrator keeps a CEP panel's document loaded even when the panel is closed/reopened; closing and reopening does NOT refresh the panel.

### Bridge

- **The bridge** — how the panel drives Illustrator: `main.js` builds a script string `$.evalFile("<extPath>/jsx/Measurement.jsx"); <fn>(<json>)`, dispatched via `window.__cs.evalScript(...)`. UI settings are passed as a JSON payload into a global JSX `CFG`.
- **Extension path** — the extension directory, obtained via `CSInterface.getSystemPath(SystemPath.EXTENSION)`, normalised to forward slashes by `getExtensionPath()`.

## Glossary avoids

- "Refresh button" as a product term — the feature is **panel refresh**, of which the button is the trigger.
- "Restart" for anything short of restarting Illustrator itself — restart is never required for code edits, only for `manifest.xml` changes.

## Architecture notes

- No git repo, no build pipeline. Release packaging is manual: `ZXPSignCmd.exe` sign → `INSTALL-WINDOWS.bat` (UPIA install). There is no dev/prod branch in code; env differences are expressed via the **dev marker**.
- The repo folder is symlinked into the CEP extensions directory (`TSP-Sign-Tools/` → `…/Adobe/CEP/extensions/TSP Signtools`), which is what makes file-marker gating seamless during development.