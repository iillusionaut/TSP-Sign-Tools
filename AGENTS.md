# AGENTS.md

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/` in this repo (local tracker, no GitHub/GitLab). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles with default label strings: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root + ADRs in `docs/adr/`. See `docs/agents/domain.md`.

## Language

- **Conversation**: Indonesian or English — whichever the user uses; reply in the same language.
- **Documentation**: English only. Every artifact written to this repo (docs, specs, tickets, ADRs, comments in committed files, commit messages) must be in English, even when the conversation is in Indonesian.

## Project notes

- This is an Adobe Illustrator CEP extension ("TSP Sign Tools"). The actual plugin lives in `TSP-Sign-Tools/` (symlink → CEP extensions dir); keep edits there.
- See `SUMMARY.md` at the repo root for the full project overview before touching code.
- No git repo / no README / no build script — packaging is manual (ZXPSignCmd → .zxp → INSTALL-WINDOWS.bat).