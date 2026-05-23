# v9 Plan: Local Workbench Frontend Entry

Date: 2026-05-23
Status: release-ready locally; commit, push, CI, and `v9` tag pending
Baseline: `v8.2`
Primary CLI: `symphony`

## Summary

v9 upgrades `symphony console` from a read-only artifact browser into the local Symphony workbench. The workbench is the recommended front door for understanding project readiness, latest run state, artifact health, run timeline, and safe next commands.

The v8.2 safety contract remains in force: browser routes are read-only, non-GET requests return `405`, artifact previews only use registered run-state references, and the UI does not trigger model calls, project writes, retries, deletes, or arbitrary filesystem reads.

## Implemented Changes

- Added `GET /api/readiness` with local Node, pnpm, git, GitHub auth/CI, and real CLI gate status. The route redacts command output, reports optional tool absence without failing the console, and sets `modelInvocation: false`.
- Added derived run timeline data to console snapshots, run responses, and `GET /api/runs/<run-id>/timeline`.
- Added copy-only recommended command objects to snapshots, runs, timelines, and readiness responses.
- Reworked the console UI into `Symphony Workbench` with readiness checks, latest run health, next commands, run list, timeline, run details, and artifact preview.
- Preserved the existing artifact preview security model: registered artifact refs only, missing/malformed/directory/large previews handled safely, and the 200 KiB file preview cap remains unchanged.

## Public Contract Additions

- Existing routes remain compatible:
  - `GET /`
  - `GET /api/health`
  - `GET /api/summary`
  - `GET /api/runs`
  - `GET /api/runs/latest`
  - `GET /api/runs/<run-id>`
  - `GET /api/runs/<run-id>/artifacts/<kind>`
- New v9 routes:
  - `GET /api/readiness`
  - `GET /api/runs/<run-id>/timeline`
- New additive fields:
  - `artifactHealth`
  - `timeline`
  - `recommendedCommands[]`

## Verification Plan

Completed local release gates:

```sh
node --test tests/symphony-cli.test.js
pnpm check
pnpm test
git diff --check
pnpm audit --audit-level high
pnpm mcas doctor
pnpm test:mutation:gate
```

Observed local results:

- `node --test tests/symphony-cli.test.js`: 30 tests passed.
- `pnpm check`: passed.
- `pnpm test`: 497 tests passed.
- `git diff --check`: passed.
- `pnpm audit --audit-level high`: exit 0; one moderate advisory remains.
- `pnpm mcas doctor`: status `ok`.
- `pnpm test:mutation:gate`: passed with mutation score 74.27 against break threshold 60.

Manual console smoke:

```sh
pnpm symphony console --port 0
curl http://127.0.0.1:<port>/api/summary
curl http://127.0.0.1:<port>/api/readiness
curl http://127.0.0.1:<port>/api/runs/latest/timeline
curl -X POST http://127.0.0.1:<port>/api/summary
```

Expected manual results:

- The browser renders `Symphony Workbench`.
- Readiness checks show local tool status without tokens.
- Recommended command buttons copy only; they do not execute.
- POST requests return `405`.
- Artifact previews remain bounded to registered refs.

Observed manual results:

- Browser smoke rendered `Symphony Workbench`.
- `/api/readiness` returned `contractName: "symphony.console-readiness"`, `readOnly: true`, and `modelInvocation: false`.
- Readiness showed Node.js, pnpm, git, and GitHub status without token values.
- `/api/runs/latest/timeline` returned `contractName: "symphony.console-run-timeline"`.
- POST `/api/summary` returned `405` with `message: "console is read-only"`.

## Release Notes

v9 is a product-entry release, not a core execution release. It does not implement `symphony do --write`, does not add browser execution buttons, and does not introduce a frontend build system or new runtime dependency.

GitHub Actions evidence should be recorded after `main` and the `v9` tag are pushed.
