# v15 Task 1 API Fixtures Evidence

Date: 2026-05-27
Task: Freeze fixture-backed Workbench console API contracts before React/Vite work.

## Files Changed

- `tests/symphony-cli.test.js`
- `docs/plans/v15-task1-api-fixtures-evidence-2026-05-27.md`

## Scenarios Covered

- Empty state / no runs
- No active Stage
- Active Stage
- Blocked Stage
- Stage Charter consistency failure fixture
- Missing artifact
- Pending adoption
- Dirty adoption readiness signal
- Readiness attention

## Route And Contract Surfaces Covered

- `buildConsoleSnapshot` / `GET /api/summary` equivalent: `symphony.console-snapshot`
- `buildConsoleReadiness` / `GET /api/readiness` equivalent: `symphony.console-readiness`
- `GET /api/health`
- `GET /api/runs`: `symphony.console-runs`
- `GET /api/runs/latest`: `symphony.console-run`
- `GET /api/runs/<run-id>/timeline`: `symphony.console-run-timeline`
- `GET /api/runs/<run-id>/artifacts/<kind>`: file, directory, missing artifact, and unregistered kind cases for `symphony.console-artifact`
- `GET /api/adoptions/<adoption-id>/inspect`: `symphony.console-adoption-inspect`

## Tests Run

- `node --test tests/symphony-cli.test.js` - passed
- `pnpm check` - passed
- `pnpm test` - passed
- `git diff --check` - passed

## Known Gaps Deferred

- Artifact previews currently expose `type`, `format`, `truncated`, `size`, `content` / `json` / `entries`, and missing status shapes, but do not expose stable `uri` / `ref`, `mime`, `title` / `displayTitle`, `safeToRenderInline`, `sourceRunId`, `artifactKind`, `previewAvailable`, or `sizeBytes`.
- `/api/summary` and `/api/readiness` do not yet expose a shared top-level `capabilities` object. Current contract fields freeze `readOnly: true` and `modelInvocation: false` on readiness, plus copy-only command modes.
- The console server and `buildConsoleSnapshot` do not accept a Stage docs directory fixture option; the Stage Charter consistency failure fixture therefore freezes the current failed-consistency route shape and records exact fixture docs-dir injection as deferred work.
- Dirty adoption is represented today by combining pending adoption summary state with dirty Git readiness signals; there is no dedicated browser `GET /api/diagnostics` route.
- Error envelopes remain route-local rather than shared across all 404/405/500 responses.

## Boundary Confirmation

- No dependency install was performed.
- No React or Vite implementation was added.
- `package.json` was not changed.
- `pnpm-lock.yaml` was not changed.
