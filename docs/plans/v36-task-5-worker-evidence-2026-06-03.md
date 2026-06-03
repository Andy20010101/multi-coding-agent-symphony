# v36 task-5 worker evidence

Date: 2026-06-03
Goal: v36-artifact-evidence-index-workspace
Task: task-5 — Export diagnostics/evidence bundle draft
Branch: v36-task-5-export-diagnostics-evidence-bundle-draft

## Summary

Added the evidence bundle module (`evidence-bundle.v1`) that exports summarized goal event data with gate mapping for diagnostics and backup consumption. The module provides a `summarizeEvent()` function that maps `goal-event-log.v1` gate events into a flat structure compatible with diagnostics exports.

## Files changed

- `src/symphony/evidence-bundle.js` (new) — module with summarizeEvent, buildEvidenceBundle, validators
- `tests/v36-task-5-evidence-bundle.test.js` (new) — 11 tests covering gate mapping, fallback, integration
- `fixtures/contracts/evidence-bundle.v1.json` (new) — contract fixture
- `docs/plans/v36-task-5-worker-evidence-2026-06-03.md` (new) — this file
- `src/symphony/console.js` — added GET /api/bundle route
- `scripts/symphony.js` — added symphony evidence bundle CLI
- `frontend/workbench/src/api/contracts.js` — added evidenceBundle route to read-only allowlist

## Gate mapping

`summarizeEvent()` gate field resolution:
- `gate_name = event.gate.name ?? event.gate.gate ?? null`
- `status = event.gate.status ?? null`

## Commands verified

```
pnpm check                            → pass
node --test tests/v36-task-5-evidence-bundle.test.js  → 11/11 pass
pnpm test                             → 0 failures
pnpm workbench:build                  → pass
git diff --check                      → pass
pnpm --silent symphony evidence bundle --goal v36-artifact-evidence-index-workspace --task task-5 --json  → OK
```

## Real CLI verification

v33 task-4 main.verification-passed events:
- gate_name = "main-verification" (was null before fix)
- status = "passed"
